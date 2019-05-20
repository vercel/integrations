const { withUiHook, htm } = require('@zeit/integration-utils')
const rp = require('request-promise')
const { promisify } = require('util')

const MAX_GRAPHS = 5
const sleep = promisify(setTimeout)

const generateGraph = async ({ query, apiKey, appKey }) => {
  const result = await rp({
    method: 'POST',
    uri: 'https://api.datadoghq.com/api/v1/graph/embed',
    qs: {
      api_key: apiKey,
      application_key: appKey,
    },
    body: {
      graph_json: JSON.stringify({
        requests: [{
            q: query,
            type: query.endsWith('.as_count()') ? 'bars' : undefined, // if using count use the bar graph
        }],
        viz: 'timeseries',
        events: []
      }),
      timeframe: '1_hour',
      // TODO: figure out how to use a smaller graph
      size: 'medium',
      legend: 'no',
      title: ' ', // empty title
    },
    json: true,
  })
  return { embedId: result.embed_id }
}

const deleteGraph = async ({ embedId, apiKey, appKey }) => {
  const result = await rp({
    method: 'GET',
    uri: `https://api.datadoghq.com/api/v1/graph/embed/${embedId}/revoke`,
    qs: {
      api_key: apiKey,
      application_key: appKey,
    },
  })
}

const throwDisplayableError = ({ message }) => {
  const error = new Error(message)
  error.displayable = true
  throw error
}

module.exports = withUiHook(async ({ payload, zeitClient }) => {
  const { clientState, action, projectId } = payload
  if (!projectId) {
    return htm`
      <Page>
        <Notice type="warn">Please select a project to install the Datadog integration.</Notice>
      </Page>
    `
  }
  const metadata = await zeitClient.getMetadata()
  if (!metadata.linkedApplications) {
    metadata.linkedApplications = {}
  }
  if (!metadata.linkedApplications[projectId]) {
    metadata.linkedApplications[projectId] = {
      envApiKey: '',
      envAppKey: '',
      graphs: [], // {query: "", embedId: ""}
    }
  }
  let errorMessage = ''
  try {
    if (action === 'submit') {
      // set metadata
      metadata.linkedApplications[projectId].envApiKey = clientState.envApiKey
      metadata.linkedApplications[projectId].envAppKey = clientState.envAppKey
      await zeitClient.setMetadata(metadata)
      // set env vars
      const secretNameApiKey = await zeitClient.ensureSecret(
        'api-key',
        metadata.linkedApplications[projectId].envApiKey
      )
      await zeitClient.upsertEnv(
        payload.projectId,
        'API_KEY',
        secretNameApiKey
      )
      const secretNameAppKey = await zeitClient.ensureSecret(
        'app-key',
        metadata.linkedApplications[projectId].envAppKey
      )
      await zeitClient.upsertEnv(
        payload.projectId,
        'APP_KEY',
        secretNameAppKey
      )
    }
    if (action === 'createGraph') {
      if (metadata.linkedApplications[projectId].graphs.length >= MAX_GRAPHS) {
        throwDisplayableError({ message: `Up to ${MAX_GRAPHS} graphs can be configured.` })
      }
      if (!clientState.graphQuery) {
        throwDisplayableError({ message: 'A graph query is required' })
      }
      if(
        !metadata.linkedApplications[projectId].envApiKey ||
        !metadata.linkedApplications[projectId].envAppKey) {
        throwDisplayableError({ message: 'API_KEY and APP_KEY must be set' })
      }
      const queryExists = metadata.linkedApplications[projectId].graphs
        .find(({ query }) => query === clientState.graphQuery)
      if (queryExists) {
        throwDisplayableError({ message: 'A graph with the query already exists.' })
      }
      const now = new Date().getTime()
      const end = Math.floor(now / 1000)
      let embedId
      try {
        const { embedId: generatedEmbedId } = await generateGraph({
          query: clientState.graphQuery,
          apiKey: metadata.linkedApplications[projectId].envApiKey,
          appKey: metadata.linkedApplications[projectId].envAppKey,
        })
        embedId = generatedEmbedId
      } catch (err) {
        console.error(err)
        throwDisplayableError({ message: 'There was an error generating the graph.' })
      }
      metadata.linkedApplications[projectId].graphs.push({
        query: clientState.graphQuery,
        embedId,
      })
      await zeitClient.setMetadata(metadata)
    }
    const destroyMatch = action.match(/destroyGraph-(\d*)/)
    if (destroyMatch) {
      const destroyIndex = parseInt(destroyMatch[1])
      const destroyGraphItem = metadata.linkedApplications[projectId].graphs[destroyIndex]
      // first delete the embed from datadog
      try {
        await deleteGraph({
          apiKey: metadata.linkedApplications[projectId].envApiKey,
          appKey: metadata.linkedApplications[projectId].envAppKey,
          embedId: destroyGraphItem.embedId
        })
      } catch (err) {
        console.error(err)
        throwDisplayableError({ message: 'There was an error deleting the graph.' })
      }
      // then remove it from metadata
      metadata.linkedApplications[projectId].graphs =
        metadata.linkedApplications[projectId].graphs.filter(
          (graph, index) => index !== destroyIndex)
      await zeitClient.setMetadata(metadata)
    }
  } catch (err) {
    if (err.displayable) {
      errorMessage = err.message
    } else {
      throw err
    }
  }

  return htm`
        <Page>
            <Box display="flex" justifyContent="center" margin-bottom="2rem">
              <Img src="https://datadog-prod.imgix.net/img/dd_logo_70x75.png" />
            </Box>
            <Container>
             ${errorMessage && htm`<Notice type="error">${errorMessage}</Notice>`}
              <H1>Environment Variables</H1>
              <P>These are the <Link href="https://docs.datadoghq.com/account_management/api-app-keys/" target="_blank">Datadog API and APP keys</Link>. The configured keys will be availble as environment variables in your deployment as <B>API_KEY</B> and <B>APP_KEY</B> the next time you deploy.</P>
              <Input
                label="API_KEY"
                name="envApiKey"
                value=${metadata.linkedApplications[projectId].envApiKey}
                type="password"
                width="100%"
              />
              <Input
                label="APP_KEY"
                name="envAppKey"
                value=${metadata.linkedApplications[projectId].envAppKey}
                type="password"
                width="100%"
              />
            </Container>
            <Container>
              <Button action="submit">Submit Keys</Button>
            </Container>
            <Container>
              <H1>Graphs</H1>
              ${
                !metadata.linkedApplications[projectId].graphs.length ?
                htm`<P>No graph queries created yet. To create a graph, add an <B>API_KEY</B> and <B>APP_KEY</B> above and follow the <Link href="https://docs.datadoghq.com/graphing/functions/" target="_blank">Datadog query documentation</Link>.</P>` :
                htm`<P>Graphs will update on page refresh. Up to 5 graphs can be configured.</P>`
              }
              ${metadata.linkedApplications[projectId].graphs.map(
                ({query, embedId}, index) => htm`
                <Container>
                  <H2>${query.replace(/{/g,'(').replace(/}/g,')') }</H2>
                  <Link href=${`https://app.datadoghq.com/graph/embed?token=${embedId}`} target="_blank">
                    <Img
                      src=${`https://datadog-integration-graph-snapshotter.zeit.sh/?embedId=${embedId}`}
                      height="260px"
                      width="100%"
                    />
                  </Link>
                  <Box display="flex" justifyContent="space-between">
                    <Link href=${`https://app.datadoghq.com/graph/embed?token=${embedId}`} target="_blank">Live Graph</Link>
                    <Button action=${`destroyGraph-${index}`} small>Remove</Button>
                  </Box>
                </Container>`)}
              <Input
                label="Graph Query"
                name="graphQuery"
                placeholder="avg:system.load.1{*}"
                width="100%"
              />
              <Box display="flex" justifyContent="space-between">
                <Button action="createGraph">Create Graph</Button>
                <Link href="https://docs.datadoghq.com/graphing/functions/" target="_blank">Datadog query documentation</Link>
              </Box>
            </Container>
        </Page>
    `
})

const { withUiHook, htm } = require('@zeit/integration-utils')

let store = {
  routes: []
}

const CreateRoute = () => htm`
  <Fieldset>
    <FsContent>
      <FsTitle>Create a New Route</FsTitle>
      <Container>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box><Input label="Source" name="new-src" placeholder="Source" /></Box>
          <Box><Input label="Destination" name="new-dest" placeholder="Destination" /></Box>
        </Box>
      </Container>
      <BR />
      <Container>
        <H2>Headers</H2>
        <Box display="flex" alignItems="center">
          <Box><Input label="Key" name="new-header-key" placeholder="Enter a HTTP header name" /></Box>
          <Box><Input label="Value" name="new-header-value"  placeholder="Enter a value for the header" /></Box>
        </Box>
      </Container>
    </FsContent>
    <FsFooter>
      <Box display="flex" justifyContent="flex-end" width="100%">
        <Box marginRight="16px">
          <Button secondary small action="clear-new-route">Clear</Button>
        </Box>
        <Button small action="save-new-route">Save Route</Button>
      </Box>
    </FsFooter>
  </Fieldset>
`

// Create function to update store.routes

module.exports = withUiHook(async ({ payload, zeitClient }) => {
  const { clientState, action } = payload
  let showCreateRoute = false


  if (action === 'submit') {}

  if (action === 'create-new-route') {
    showCreateRoute = true
  }

  if (action === 'save-new-route') {
    showCreateRoute = false
  }

  if (!payload.project) {
    return htm`
      <Page>Please choose a project</Page>
    `
  }

  const latestProjectDeployments = await zeitClient.fetchAndThrow(`/v4/now/deployments?projectId=${payload.project.id}`, { method: 'GET' })

  if (!latestProjectDeployments.deployments.length) {
    return htm`
      <Page>This project has no deployments. Please make one before using this integration.</Page>
    `
  }

  const latestDeployment = await zeitClient.fetchAndThrow(`/v9/now/deployments/${latestProjectDeployments.deployments[0].uid}`, { method: 'GET' })

  const routes = latestDeployment.routes || []

  let newRoutes = []
  let previousHeaders = {}
  let createdRoute = {}


  if (Object.entries(clientState).length === 0 && clientState.constructor === Object) {
    store.routes = routes
  } else {
    Object.entries(clientState).map(([key, value], index) => {
      const entryIndex = key.substr(0, key.indexOf('-'))
      const rest = key.substr(key.indexOf('-') + 1, key.length)
      const next = rest.substr(0, rest.indexOf('-'))

      if (next !== 'header' && entryIndex !== 'new') {
        if (value) {
          if (newRoutes[entryIndex]) {
            newRoutes[entryIndex][rest] = value
          } else {
            newRoutes[entryIndex] = { [rest]: value }
          }
        }
      } else if (entryIndex === 'new') {
        if (value) {
          createdRoute[rest] = value
        }
      } else {
        const headerKey = rest.replace('header-', '')
        const headerIndex = headerKey.split('-')[0]

        if (previousHeaders[entryIndex]) {
          previousHeaders[entryIndex][headerIndex].value = value
        } else {
          previousHeaders[entryIndex] = []
          previousHeaders[entryIndex][headerIndex] = { key: value }
        }

      }
    })

    if (!(Object.entries(previousHeaders).length === 0 && previousHeaders.constructor === Object)) {
      Object.entries(previousHeaders).map(([key, value]) => {
        const routeIndex = key

        value.map((header) => {

          if (Object.entries(newRoutes[routeIndex]).length === 0 && newRoutes[routeIndex].constructor === Object) {
            newRoutes[routeIndex] = { headers: {} }
          }


          newRoutes[routeIndex].headers = {
            [header.key]: header.value
          }

        })
      })
    }

    if (!(Object.entries(createdRoute).length === 0 && createdRoute.constructor === Object)) {
      newRoutes.push(createdRoute)
    }

    store.routes = newRoutes
  }


  const routesAvailable = store.routes.length ? true : false

  return htm`
    <Page>
      ${routesAvailable ? htm`
        ${store.routes.map((route, index) => htm`
          ${route.handle ? htm`
            <Container>
              The following Routes will be handled through the filesystem
              <Box display="none"><Input name=${`${index}-handle`} value="${route.handle}" /></Box>
            </Container>
          ` : htm`
            <Fieldset>
              <FsContent>
                <Container>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box><Input label="Source" value="${route.src || ''}" name=${`${index}-src`} placeholder="Source" /></Box>
                    <Box><Input label="Destination" value="${route.dest || ''}" name=${`${index}-dest`} placeholder="Destination" /></Box>
                  </Box>
                </Container>
                ${route.headers ? htm`
                  <BR />
                  <Container>
                    <H2>Headers</H2>
                    <Box display="flex" alignItems="center">
                      ${Object.entries(route.headers).map(([key, value], hIndex) => htm`
                        <Box><Input label="Key" value="${key}" name=${`${index}-header-${hIndex}-${key}`} placeholder="Header Key" /></Box>
                        <Box><Input label="Value" value="${value}" name=${`${index}-header-${hIndex}-${value}`}  placeholder="Header Value" /></Box>
                      `)}
                    </Box>
                  </Container>
                ` : 'Add Headers'}
              </FsContent>
            </Fieldset>
          `}
        `)}

        ${ showCreateRoute ? htm`<${CreateRoute} />` : '' }

        <Container>
          ${ !showCreateRoute ? htm`<Button action="create-new-route">Add New Route</Button>` : '' }
          <Button action="save">Save</Button>
        </Container>

        ${store.routes !== routes ? htm`
          <BR />
          <Container>
            <H1>New routes</H1>
            <P>Copy the following routes and paste them into your now.json file:</P>
            <Code>${JSON.stringify(store.routes, null, 2)}</Code>
          </Container>
        ` : 'No new changes'}
      ` : htm`
        <P>There are no routes for this project. Go ahead and add one:</P>
        <Container>
          ${ !showCreateRoute ? htm`<Button action="create-new-route">Add New Route</Button>` : '' }
          ${ showCreateRoute ? htm`<${CreateRoute} />` : ''
          }
        </Container>

      `}


    </Page>
  `

  //TODO:
  // - Offer Continue (disable dest when selected)
})

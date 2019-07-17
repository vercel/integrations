const { withUiHook } = require('@zeit/integration-utils')
const formBuilder = require('./form-builder')
const deploy = require('./deploy')
module.exports = withUiHook(async ({ payload, zeitClient }) => {
  const { clientState, project, team, action, configurationId } = payload
  let metadata = await zeitClient.getMetadata()
  let _metadata = metadata
  const projectData = metadata.projectData || {}
  if (project && !projectData[project.name]) {
    return `
      <Page>
        <Notice type="error">This is not a valid Airform project.</Notice>
        <Link href="https://zeit.co/dashboard${
      team ? '/' + encodeURIComponent(team.slug) : ''
      }/integrations/${
      configurationId
      }">Create a new Airform project →</Link>
      </Page>
    `
  } else if (project) {
    metadata = projectData[project.name]
  }
  const inputs = metadata.inputs || []
  let newType = clientState.newType || 'input'
  let newLabel = (clientState.newLabel || '').trim()
  let message = ''
  let changed = false

  // update fields
  function checkField(name) {
    if (clientState[name] !== undefined && clientState[name] !== metadata[name]) {
      changed = true
      metadata[name] = clientState[name]
    }
  }
  checkField('content')
  checkField('projectName')
  checkField('apiKey')
  checkField('baseName')
  checkField('tableName')
  if (action) {
    switch (action) {
      case 'add':
        if (!newLabel) {
          message = '<Notice type="error">Label cannot be empty.</Notice>'
          break
        }
        inputs.push({
          type: newType,
          label: newLabel
        })
        metadata.inputs = inputs
        changed = true
        newType = 'input'
        newLabel = ''
        break
      case 'create':
        if (!metadata.apiKey) {
          message = '<Notice type="error">API key is required.</Notice>'
          break
        }
        if (!metadata.baseName) {
          message = '<Notice type="error">Base name is required.</Notice>'
          break
        }
        if (!metadata.tableName) {
          message = '<Notice type="error">Table name is required.</Notice>'
          break
        }
        const { url } = await deploy({
          metadata,
          zeitClient
        })
        if (url) {
          projectData[metadata.projectName] = {
            inputs: metadata.inputs,
            content: metadata.content,
            projectName: metadata.projectName,
            apiKey: metadata.apiKey,
            baseName: metadata.baseName,
            tableName: metadata.tableName,
            url
          }
          // project created, clean all the other data
          await zeitClient.setMetadata({
            projectData,
            apiKey: metadata.apiKey
          })
          return `
            <Page>
              <Notice type="success">Form deployed successfully!</Notice>
              <P><Link href="https://${url}">${url}</Link> → <Link href="https://airtable.com/${metadata.baseName}">airtable.com/${metadata.baseName}</Link></P>
            </Page>
          `
        }
        break
      default:
        if (action.startsWith('remove-')) {
          let index = +action.slice(7)
          if (inputs[index]) {
            inputs.splice(index, 1)
            metadata.inputs = inputs
            changed = true
          }
        }
        break
    }
  }
  if (changed) {
    if (project) {
      _metadata.projectData = projectData
      await zeitClient.setMetadata(_metadata)
    } else {
      await zeitClient.setMetadata(metadata)
    }
  }
  const projectName = metadata.projectName || 'my-airform'
  const content = metadata.content || `# 👋 Welcome!\n\nYou can write the webpage content in Markdown.`
  const apiKey = metadata.apiKey || ''
  const baseName = metadata.baseName || ''
  const tableName = metadata.tableName || ''
  return `
    <Page>
      ${message}
      <H2>${project ? `Edit Your Form (<Link href="https://${metadata.url}" target="_blank">Form ↗</Link> <Link href="https://airtable.com/${metadata.baseName}" target="_blank">Airtable ↗</Link>)` : 'Create A New Airtable Form Project'}</H2>
      <Box display="flex" justifyContent="space-between">
        <Input name="projectName" label="Project Name" value="${projectName}" width="300px" placeholder="Project Name" ${project ? 'disabled' : ''}/>
        <Box display="flex">
          <Input name="apiKey" value="${apiKey}" label={<Box>Airtable <Link href="https://airtable.com/account" target="_blank">API Key ↗</Link></Box>} type="password" width="150px" />
          <Box marginLeft="20px">
            <Input name="baseName" value="${baseName}" label="Base" placeholder="appKjmZc3TU75FCWX" width="180px" />
          </Box>
          <Box marginLeft="20px">
            <Input name="tableName" value="${tableName}" label="Table" placeholder="Entries" width="130px" />
          </Box>
        </Box>
      </Box>
      <Box borderRadius="5px" background="white" marginTop="20px">
        <Textarea name="content" width="100%" height="40vh" value="${content}" />
      </Box>
      ${!inputs.length ? '<Box marginTop="20px" color="#999">No form attached.</Box>' : ''}
      ${formBuilder(inputs, newType, newLabel)}
      <Button highlight shadow action="create">${project ? 'Update' : 'Create'}</Button>
    </Page>
  `
})

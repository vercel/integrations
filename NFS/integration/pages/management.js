const { htm } = require('@zeit/integration-utils')

const { deleteDeployment } = require('../lib/meta.js')
const { nuke, get } = require('../lib/ZEIT.js')

const defaultView = async (ctx, deployment, token) => {
  const liveDeployment = JSON.parse(await get(deployment, token))
  if (liveDeployment.error) {
    deleteDeployment(ctx, deployment)
    return htm`<Container></Container>`
  }
  return htm`
  <Container>
  <Fieldset>
    <FsContent>
      <AutoRefresh timeout="3000" />
      <FsTitle>Bucket Name: ${deployment.bucket_name}</FsTitle>
        <P><B>Aliases:</B></P>
        <UL>
          ${liveDeployment.aliasFinal
          ? liveDeployment.aliasFinal.map(alias => htm`
            <LI>${alias}</LI>
          `)
          : 'Waiting...'}
        </UL>
      <Box display="flex" justifyContent="left">
        <P>Created At: ${new Date(deployment.created_at).toLocaleString('en-GB')}</P>
      </Box>
    </FsContent>
    <FsFooter>
      <Box display="flex" justifyContent="right">
        <Button action="${'request-to-nuke-' + deployment.id}">Delete</Button>
      </Box>
    </FsFooter>
  </Fieldset>
  </Container>
  <BR />
  `
}

const requestToNuke = (deployment) => {
  return htm`
  <Container>
    <Notice type="warn">Are you sure you want to delete the deployment related to this bucket?</Notice>
    <Box display="flex" justifyContent="space-between">
      <Button action="${'actually-nuke-' + deployment.id}">Yes</Button>
      <Button action="">No</Button>
    </Box>
  </Container>
  <BR />
  `
}

module.exports = async (ctx, deployment, token) => {
  const { action } = ctx.payload

  switch (action) {
    case `${'request-to-nuke-' + deployment.id}`:
      return requestToNuke(deployment)
    case `${'actually-nuke-' + deployment.id}`:
      await nuke(deployment, token)
      await deleteDeployment(ctx, deployment)
      break
    default:
      return defaultView(ctx, deployment, token)
  }
}

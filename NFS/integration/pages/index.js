const { withUiHook, htm } = require('@zeit/integration-utils')
const { checkAndLoadMetadata } = require('../lib/meta')

const installation = require('./installation')
const management = require('./management')
const doSpaces = require('./do-instructions')
const rest = require('./rest-instructions')

const withPage = async fnArray =>
  htm`
    <Page>
    <Box textAlign="center">
      <Button small action="dashboard">Dashboard</Button>
      <Button small action="do-tutorial">Digital Ocean Instructions</Button>
      <Button small action="rest-tutorial">NSF Instructions</Button>
    </Box>
    <BR />
      ${await Promise.all(fnArray)}
    </Page>
  `

module.exports = withUiHook(async (ctx) => {
  switch (ctx.payload.action) {
    case 'do-tutorial':
      return withPage([doSpaces])
    case 'rest-tutorial':
      return withPage([rest])
    case 'reset':
    case 'submit':
    case 'dashboard':
    default:
      const metaStorage = await checkAndLoadMetadata(ctx)
      const needToBeManaged = metaStorage.deployments.map((deployment) => {
        return management(ctx, deployment, metaStorage.access_token)
      })

      return withPage([
        ...needToBeManaged,
        installation(ctx, metaStorage)
      ])
  }
})

const { getStore } = require('../lib/mongo')
const { createComment } = require('../lib/comment')
const { ZeitClient } = require('@zeit/integration-utils')
const frameworks = require('../lib/frameworks')
const getStrategy = require('../lib/strategy')
const mql = require('@microlink/mql')
const { withSentry } = require('../lib/sentry')

const { MAX_WIDTH, MAX_SCREENSHOTS } = require('../lib/constants')

const { MICROLINK_API_KEY } = process.env

const takeScreenshot = async (url, opts = {}) => {
  const { data } = await mql(url, {
    apiKey: MICROLINK_API_KEY,
    force: true,
    screenshot: true,
    ttl: '30d',
    filter: 'screenshot',
    viewport: { deviceScaleFactor: 1 },
    meta: false,
    colorScheme: 'light',
    codeScheme: 'ghcolors',
    styles: [
      '#screenshot pre{background:#fff}#screenshot .token.string{color:#f81ce5}#screenshot .token.number{color:#50e3c2}'
    ],
    ...opts
  })

  return data.screenshot.url
}

const wrapWithWeServ = (url, isThumbnail = false) => {
  return `https://images.weserv.nl?url=${url}${
    isThumbnail ? `&w=${MAX_WIDTH * 2}` : ''
  }`
}

module.exports = withSentry('webhook', async (req, res) => {
  const event = req.body
  const { type, ownerId, teamId, payload } = event

  // not a deployment-ready event
  if (type !== 'deployment-ready') return res.send()

  const { meta } = payload.deployment

  let provider
  if (meta.githubDeployment) {
    provider = 'github'
  } else if (meta.gitlabDeployment) {
    provider = 'gitlab'
  }

  // not a "git" deployment
  if (!provider) return res.send()

  // log event
  console.log(
    `Received event for ready deployment ${event.payload.deploymentId}`
  )

  // retrieve zeit token and provider token from store
  const store = await getStore()
  const authDoc = await store.findOne({ ownerId })

  if (!authDoc) {
    console.log(`ignoring event: ${ownerId} does not have a auth document`)
    return res.send()
  }

  const { token, [provider + 'Token']: providerToken } = authDoc

  if (!token || !providerToken) {
    console.log(`ignoring event: ${ownerId} does not have a ${provider}Token`)
    return res.send()
  }

  // get pull request associated to commit
  const strategy = getStrategy(provider)
  const providerClient = await strategy.createClient(providerToken)

  // client is null if the token has been revoked or is not valid
  if (!providerClient) {
    await store.updateOne({ ownerId }, { $unset: { [`${provider}Token`]: '' } })
    console.log(`ignoring event: ${provider}Token revoked by user or not valid`)
    return res.send()
  }

  // get package.json content
  const packageJsonContent = await strategy.getFileContent(providerClient, {
    meta,
    filePath: 'package.json'
  })

  if (!packageJsonContent) {
    console.log('no package.json content found')
    return res.send()
  }

  // parse package.json
  let pkg = {}
  try {
    pkg = JSON.parse(packageJsonContent)
  } catch (err) {
    console.log('error: could not parse package.json')
    console.error(err)
    return res.send()
  }

  // look for a framework in deps
  const pkgDeps = { ...pkg.dependencies, ...pkg.devDependencies }
  const framework = frameworks.find(f => pkgDeps[f.dependency])
  if (!framework) {
    console.log('ignoring event: no framework dependency found in package.json')
    return res.send()
  }

  // get pull request associated to commit
  const pull = await strategy.getPull(providerClient, { meta })

  if (!pull) {
    console.log(`ignoring event: no PR associated with commit`)
    return res.send()
  }

  const diff = await strategy.getDiff(providerClient, { meta, pull })

  if (!diff) {
    console.log(`ignoring event: diff could not be retrieved (not found)`)
    return res.send()
  }

  const routes = diff.modified.map(framework.routes).filter(Boolean)
  const deleted = diff.deleted.map(framework.routes).filter(Boolean)

  if (routes.length === 0 && deleted.length === 0) {
    console.log(`ignoring event: no changed route`)
    return res.send()
  }

  let deploymentUrl = `https://${payload.deployment.url}`
  let aliasUrl = null

  // if there's an alias, use alias url instead
  try {
    const zeitClient = new ZeitClient({ token, teamId })
    const { alias } = await zeitClient.fetchAndThrow(
      `/v9/now/deployments/${payload.deploymentId}`,
      {}
    )
    if (alias.length > 0) {
      aliasUrl = `https://${alias.pop()}`
    }
  } catch (err) {
    console.warn('warning, error while fetching alias', err)
  }

  console.log('creating screenshots...')

  const screenshotRoutes = []
  const otherRoutes = []
  const shouldScreenshot = framework.shouldScreenshot || (() => true)

  for (let route of routes) {
    if (shouldScreenshot(route) && screenshotRoutes.length < MAX_SCREENSHOTS) {
      screenshotRoutes.push(route)
    } else {
      otherRoutes.push(route)
    }
  }

  const screenshots = await Promise.all(
    screenshotRoutes.map(async route => {
      const url = `${deploymentUrl}${route}`

      const [thumbnailUrl, screenshotUrl] = await Promise.all([
        takeScreenshot(url),
        takeScreenshot(url, { fullPage: true })
      ])

      return {
        route,
        routeLink: `${aliasUrl || deploymentUrl}${route}`,
        thumbnailUrl: wrapWithWeServ(thumbnailUrl, true),
        screenshotUrl: wrapWithWeServ(screenshotUrl)
      }
    })
  )

  const others = otherRoutes.map(route => ({
    route,
    routeLink: `${aliasUrl || deploymentUrl}${route}`
  }))

  console.log('writing PR comment...')

  const comment = createComment({
    commitSha: strategy.getCommitShaFromMeta(meta),
    url: aliasUrl || deploymentUrl,
    screenshots,
    others,
    deleted
  })

  await strategy.upsertComment(providerClient, { meta, pull, body: comment })

  return res.send()
})

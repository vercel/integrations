const { getStore } = require('../lib/mongo')
const { getContext, setContext, redirect } = require('../lib/context')
const getStrategy = require('../lib/strategy')
const { withSentry } = require('../lib/sentry')

module.exports = withSentry('callback', async (req, res) => {
  const { code } = req.query

  const { ownerId, next, provider } = getContext(req)

  const strategy = getStrategy(provider)
  const token = await strategy.getToken(code)

  const store = await getStore()
  await store.updateOne(
    { ownerId },
    {
      $set: {
        [provider + 'Token']: token
      }
    }
  )

  console.log(`oauth connection done: added ${provider} to ${ownerId}`)

  setContext(res, {})
  redirect(res, next)
})

const { setContext, redirect } = require('../lib/context')
const getStrategy = require('../lib/strategy')

module.exports = async (req, res) => {
  const { ownerId, next, provider } = req.query

  const strategy = getStrategy(provider)

  const authorizeEndpoint = strategy.getAuthorizeEndpoint()

  setContext(res, { ownerId, provider, next })
  redirect(res, authorizeEndpoint)
}

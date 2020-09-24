const fetch = require('../lib/fetch')
const { getStore } = require('../lib/mongo')
const { withSentry, sendToSentry } = require('../lib/sentry')

module.exports = withSentry('setup', async (req, res) => {
  const resAuth = await fetch('https://api.vercel.com/v2/oauth/access_token', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded'
    },
    body: require('querystring').stringify({
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      code: req.query.code,
      redirect_uri: process.env.INTEGRATION_URL + '/api/setup'
    })
  })
  const jsonAuth = await resAuth.json()

  if (!resAuth.ok) {
    sendToSentry(
      new Error(
        `Error: authenticating failed with code ${
          resAuth.status
        } and response ${JSON.stringify(jsonAuth)}`
      )
    )
    return res.status(resAuth.status).json(jsonAuth)
  }

  const token = jsonAuth.access_token

  const resWebhook = await fetch(
    `https://api.vercel.com/v1/integrations/webhooks${
      req.query.teamId ? `?teamId=${req.query.teamId}` : ''
    }`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'deploy-summary-webhook',
        url: `${process.env.INTEGRATION_URL}/api/webhook`
      })
    }
  )
  const jsonWebhook = await resWebhook.json()

  if (!resWebhook.ok) {
    sendToSentry(
      new Error(
        `Error: creating webhook failed with code ${
          resWebhook.status
        } and response ${JSON.stringify(jsonWebhook)}`
      )
    )
    return res.status(resWebhook.status).json(jsonWebhook)
  }

  try {
    const store = await getStore()
    const { ownerId, id: webhookId } = jsonWebhook
    await store.updateOne(
      { ownerId },
      { $set: { ownerId, webhookId, token } },
      { upsert: true }
    )
  } catch (err) {
    sendToSentry(err)
    console.error(`failed to setup integration`)
    return res.status(500).json({
      error: {
        code: 'internal_server_error',
        message: 'Inserting in database failed'
      }
    })
  }

  res.setHeader('location', req.query.next)
  res.status(302).send('Redirecting...')
})

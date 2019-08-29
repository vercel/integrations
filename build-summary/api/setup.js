const fetch = require('../lib/fetch')
const { getStore } = require('../lib/mongo')

module.exports = async (req, res) => {
  const resAuth = await fetch('https://api.zeit.co/v2/oauth/access_token', {
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
    return res.status(resAuth.status).json(jsonAuth)
  }

  const token = jsonAuth.access_token

  const resWebhook = await fetch(
    `https://api.zeit.co/v1/integrations/webhooks${
      req.query.teamId ? `?teamId=${req.query.teamId}` : ''
    }`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'build-summary-webhook',
        url: `${process.env.INTEGRATION_URL}/api/webhook`
      })
    }
  )
  const jsonWebhook = await resWebhook.json()

  if (!resWebhook.ok) {
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
    console.error(err)
    return res.status(500).json({
      error: {
        code: 'internal_server_error',
        message: 'Inserting in database failed'
      }
    })
  }

  res.setHeader('location', req.query.next)
  res.status(302).send('Redirecting...')
}

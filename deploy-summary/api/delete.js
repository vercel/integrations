const { getStore } = require('../lib/mongo')
const { withSentry, sendToSentry } = require('../lib/sentry')

module.exports = withSentry('delete', async (req, res) => {
  const ownerId = req.body.teamId || req.body.userId

  try {
    const store = await getStore()
    await store.deleteOne({ ownerId })
    return res.send()
  } catch (err) {
    sendToSentry(err)
    console.error(`failed to delete integration`)
    return res.status(500).send()
  }
})

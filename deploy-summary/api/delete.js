const { getStore } = require('../lib/mongo')

module.exports = async (req, res) => {
  const ownerId = req.body.teamId || req.body.userId

  try {
    const store = await getStore()
    await store.deleteOne({ ownerId })
    return res.send()
  } catch (err) {
    console.log(`failed to delete integration for owner ${ownerId}`)
    console.error(err)
    return res.status(500).send()
  }
}

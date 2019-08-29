const MongoClient = require('mongodb').MongoClient

let client

module.exports = {
  getStore: async () => {
    if (!client) {
      client = new MongoClient(process.env.MONGO_URI, {
        useNewUrlParser: true
      })
      await client.connect()
    }
    return client
      .db('build-summary-integration')
      .collection('build-summary-store')
  },
  closeStore: async () => {
    client = null
    if (client) {
      await client.close()
    }
  }
}

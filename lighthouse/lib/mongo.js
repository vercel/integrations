const { MongoClient } = require("mongodb");
const { MONGO_DB, MONGO_URI } = require("./env");

let clientPromise;
let dbPromise;

function connect() {
  return MongoClient.connect(MONGO_URI, {
    bufferMaxEntries: 0,
    poolSize: 1,
    useNewUrlParser: true
  });
}

module.exports = async () => {
  if (dbPromise) {
    const db = await dbPromise;

    if (!db.serverConfig.isConnected()) {
      clientPromise = null;
      dbPromise = null;
    }
  }

  if (!clientPromise) {
    console.log("connecting Mongo");
    clientPromise = connect();
  }

  if (!dbPromise) {
    dbPromise = clientPromise.then(c => c.db(MONGO_DB));
  }

  return dbPromise;
};

exports = module.exports;

exports.close = async () => {
  if (clientPromise) {
    const client = await clientPromise;

    console.log("disconnecting Mongo");
    await client.close();
    clientPromise = null;
    dbPromise = null;
  }
};

exports.withClose = fn => {
  return async function(...args) {
    try {
      return await fn.apply(this, args);
    } finally {
      await exports.close();
    }
  };
};

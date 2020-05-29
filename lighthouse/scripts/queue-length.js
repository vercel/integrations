#!/usr/bin/env node

const { MongoClient } = require("mongodb");

const { MONGO_DB, MONGO_URI } = process.env;
if (!MONGO_DB) {
  throw new Error("missing environment variable: MONGO_DB");
}

if (!MONGO_URI) {
  throw new Error("missing environment variable: MONGO_URI");
}

function withMongo(fn) {
  return async function(...args) {
    const client = await MongoClient.connect(MONGO_URI, {
      useNewUrlParser: true
    });

    try {
      return await fn.call(this, client, ...args);
    } finally {
      await client.close();
    }
  };
}

const main = withMongo(async function(client) {
  const db = client.db(MONGO_DB);

  const count = await db
    .collection("deployments")
    .countDocuments({ auditing: { $ne: null } });

  console.log(count);
});

main().catch(console.error);

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
  console.log(`> provisioning mongo: ${MONGO_DB}`);

  const db = client.db(MONGO_DB);

  const collections = await db
    .listCollections(null, { nameOnly: true })
    .toArray();
  const collectionNames = new Set(collections.map(c => c.name));

  if (!collectionNames.has("users")) {
    console.log("> creating collection: users");
    await db.createCollection("users");
  }

  if (!collectionNames.has("teams")) {
    console.log("> creating collection: teams");
    await db.createCollection("teams");
  }

  if (!collectionNames.has("deployments")) {
    console.log("> creating collection: deployments");
    await db.createCollection("deployments");
  }

  console.log("> creating users collection indexes");
  await db.collection("users").createIndex({ id: 1 }, { unique: true });

  console.log("> creating teams collection indexes");
  await db.collection("teams").createIndex({ id: 1 }, { unique: true });

  console.log("> creating deployments collection indexes");
  const deploymentsCollection = db.collection("deployments");
  await deploymentsCollection.createIndex({ id: 1 }, { unique: true });
  await deploymentsCollection.createIndex({ url: 1 }, { unique: true });
  await deploymentsCollection.createIndex({ ownerId: 1, auditing: 1 });
  await deploymentsCollection.createIndex({ auditing: 1 });
});

main().catch(console.error);

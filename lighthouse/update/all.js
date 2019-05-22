const { RateLimit } = require("async-sema");
const auth = require("../lib/auth");
const fetchApi = require("../lib/fetch-api");
const mongo = require("../lib/mongo");

const BATCH_SIZE = 20;

const limit = RateLimit(50);

async function fetchUpdateOwner(buf) {
  await limit();

  console.log(`requesting /update/owner.js: ${buf.length}`);

  // don't wait for response
  fetchApi("/update/owner.js", buf).catch(console.error);
}

async function update(name) {
  const db = await mongo();

  console.log(`getting ${name} docs`);
  const cursor = await db.collection(name).find(
    {},
    {
      projection: { accessToken: 1, id: 1 }
    }
  );
  let buf = [];

  while (true) {
    const doc = await cursor.next();
    if (!doc) break;

    const { accessToken, id } = doc;
    buf.push({ accessToken, id });

    if (buf.length < BATCH_SIZE) continue;

    fetchUpdateOwner(buf);
    buf = [];
  }

  if (buf.length) {
    fetchUpdateOwner(buf);
  }
}

module.exports = mongo.withClose(
  auth(async (req, res) => {
    await Promise.all([update("users"), update("teams")]);

    res.end("ok");
  })
);

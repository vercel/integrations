const { RateLimit } = require("async-sema");
const auth = require("../lib/auth");
const fetchApi = require("../lib/fetch-api");
const mongo = require("../lib/mongo");

const limit = RateLimit(50);

async function update(name) {
  const db = await mongo();

  console.log(`getting ${name} docs`);
  const cursor = await db.collection(name).find();

  while (true) {
    const doc = await cursor.next();
    if (!doc) break;

    await limit();

    const { accessToken, id } = doc;

    // don't wait for response
    fetchApi("/update/owner.js", { accessToken, id });
  }
}

module.exports = mongo.withClose(
  auth(async (req, res) => {
    await Promise.all([update("users"), update("teams")]);

    res.end("ok");
  })
);

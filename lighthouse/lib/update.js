const { RateLimit } = require("async-sema");
const fetchApi = require("./fetch-api");
const mongo = require("./mongo");
const sleep = require("./sleep");

const BATCH_SIZE = 10;
const LIMIT = 500;

const rateLimit = RateLimit(5);

async function fetchUpdateOwner(buf) {
  await rateLimit();

  // don't wait for response
  fetchApi("/update/owner.js", buf).catch(console.error);
  await sleep(500);
}

async function fetchNext(name, from) {
  await rateLimit();
  fetchApi(`/update/${name}.js`, { from }).catch(console.error);
  await sleep(500);
}

module.exports = async function update(name, { from } = {}) {
  const db = await mongo();

  const query = {
    accessToken: { $ne: null }
  };
  if (from) {
    query.id = { $gte: from };
  }

  console.log(`getting ${name} docs${from ? ` from ${from}` : ''}`);
  const cursor = await db.collection(name).find(query, {
    limit: LIMIT + 1,
    projection: { accessToken: 1, id: 1 },
    sort: { id: 1 }
  });

  let buf = [];
  let count = 0;
  const requests = [];
  while (true) {
    const doc = await cursor.next();
    if (!doc) break;

    count++;
    if (count > LIMIT) {
      requests.push(fetchNext(name, doc.id));
      break;
    }

    const { accessToken, id } = doc;
    buf.push({ accessToken, id });

    if (buf.length < BATCH_SIZE) continue;

    requests.push(fetchUpdateOwner(buf));
    buf = [];
  }

  if (buf.length) {
    requests.push(fetchUpdateOwner(buf));
  }

  await Promise.all(requests);
};

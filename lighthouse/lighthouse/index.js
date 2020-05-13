const { promisify } = require("util");
const zlib = require("zlib");
const mql = require("@microlink/mql")
const auth = require("../lib/auth");
const mongo = require("../lib/mongo");

const gzip = promisify(zlib.gzip);

async function handler(req, res) {
  let id;
  let url;
  let ownerId;

  try {
    ({ id, url, ownerId } = req.body);
  } catch (err) {
    res.statusCode = 400;
    res.end("Invalid JSON");
    return;
  }

  if (!id || !url || !ownerId) {
    res.statusCode = 400;
    res.end("Missing required properties: id, url or ownerId");
    return;
  }

  console.log(`generating report: ${id}, ${url}`);

  const { data } = await mql(`https://${url}`, {
    apiKey: process.env.MICROLINK_API_KEY,
    ttl: '30d',
    meta: false,
    filter: 'insights',
    insights: {
      technologies: false,
      lighthouse: true
    }
  });

  let report = data.insights.lighthouse;

  let scores;

  if (report) {
    scores = Object.values(report.categories).reduce((o, c) => {
      o[c.id] = c.score;
      return o;
    }, {});

    report = await gzip(report);
  }

  console.log(`saving deployment: ${id}, ${url}`);

  const db = await mongo();
  await db.collection("deployments").updateOne(
    { id },
    {
      $set: {
        id,
        url,
        ownerId,
        scores,
        report,
        auditing: null
      },
      $setOnInsert: {
        createdAt: Date.now()
      }
    },
    { upsert: true }
  );

  res.end("ok");
}

module.exports = mongo.withClose(auth(handler));

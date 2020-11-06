const crtpto = require("crypto");
const { timeout } = require("promise-timeout");
const mongo = require("../lib/mongo");
const { CLIENT_SECRET } = require("../lib/env");

function verifySignature(req, payload) {
  const signature = crypto.createHmac('sha1', CLIENT_SECRET)
    .update(payload)
    .digest('hex');
  return signature === req.headers['x-vercel-signature'];
}

module.exports = mongo.withClose(async (req, res) => {
  const payload = req.body;
  if (!verifySignature(req, JSON.stringify(payload))) {
    res.statusCode = 403;
    res.end('Invalid signature');
    return;
  }

  if (!req.query.ownerId) {
    res.statusCode = 400;
    res.end('Missing query: ownerId');
    return;
  }

  const db = await timeout(mongo(), 5000);
  await db.collection("deployments").updateOne(
    { id: payload.deployment },
    {
      $setOnInsert: {
        id: payload.deploymentId,
        url: payload.url,
        ownerId: req.query.ownerId,
        scores: null,
        report: null,
        lhError: null,
        auditing: Date.now(),
        createdAt: Date.now()
      }
    },
    { upsert: true }
  );
});

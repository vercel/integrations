const crypto = require("crypto");
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
  const body = req.body || '';
  if (!verifySignature(req, JSON.stringify(body))) {
    res.statusCode = 403;
    res.end('Invalid signature');
    return;
  }

  const db = await timeout(mongo(), 5000);
  await db.collection("deployments").updateOne(
    { id: body.payload.deploymentId },
    {
      $setOnInsert: {
        id: body.payload.deploymentId,
        url: body.payload.url,
        ownerId: body.ownerId,
        scores: null,
        report: null,
        lhError: null,
        auditing: Date.now(),
        createdAt: Date.now()
      }
    },
    { upsert: true }
  );
  res.end('ok');
});

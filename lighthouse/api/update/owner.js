const { RateLimit } = require("async-sema");
const { timeout } = require("promise-timeout");
const auth = require("../../lib/auth");
const {
  AUDIT_DEPLOYMENTS_COUNT,
  AUDIT_DEPLOYMENTS_CREATED_AFTER
} = require("../../lib/constants");
const fetchDeployments = require("../../lib/fetch-deployments");
const mongo = require("../../lib/mongo");

const limitUpdate = RateLimit(5);

async function update({ accessToken, id }) {
  const isTeam = id.startsWith("team_");

  await limitUpdate();

  console.log(`fetching deployments for ${id}`);

  // recent deployments
  let deployments = await fetchDeployments({
    accessToken,
    limit: AUDIT_DEPLOYMENTS_COUNT,
    since: Date.now() - AUDIT_DEPLOYMENTS_CREATED_AFTER,
    teamId: isTeam ? id : null
  }).catch(async err => {
    if (err.res && err.res.status === 403) {
      console.log(
        `Ignoring deployments for ${id}. The token is not valid anymore`
      );
      const db = await mongo();
      await db
        .collection(isTeam ? "teams" : "users")
        .updateOne({ id }, { $set: { accessToken: null } });
      return;
    }

    throw err;
  });
  if (!deployments) return;

  deployments = deployments.filter(d => d.state === "READY");
  if (!deployments.length) return;

  const ownerId = id;
  const operations = await Promise.all(
    deployments.map(async deployment => {
      return {
        updateOne: {
          filter: { id: deployment.uid },
          update: {
            $setOnInsert: {
              id: deployment.uid,
              url: deployment.url,
              ownerId,
              scores: null,
              report: null,
              lhError: null,
              auditing: Date.now(),
              createdAt: Date.now()
            }
          },
          upsert: true
        }
      };
    })
  );

  const db = await timeout(mongo(), 5000);
  await db.collection("deployments").bulkWrite(operations);
}

async function handler(req, res) {
  const owners = Array.isArray(req.body) ? req.body : [req.body];

  for (const o of owners) {
    if (!o || !o.accessToken || !o.id) {
      res.statusCode = 400;
      res.end("Missing required properties: accessToken, id");
      return;
    }
  }

  await Promise.all(owners.map(update));

  res.end("ok");
}

module.exports = mongo.withClose(auth(handler));

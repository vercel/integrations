const { RateLimit } = require("async-sema");
const rawBody = require("raw-body");
const auth = require("../lib/auth");
const {
  AUDIT_DEPLOYMENTS_COUNT,
  AUDIT_DEPLOYMENTS_CREATED_AFTER
} = require("../lib/constants");
const fetchDeployments = require("../lib/fetch-deployments");
const mongo = require("../lib/mongo");
const runAudits = require("../lib/run-audits");

const limitUpdate = RateLimit(5);
const limitLighthouse = RateLimit(5);

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
  }).catch(err => {
    if (err.res && err.res.status === 403) {
      // TODO: remove the user from database
      console.log(
        `Ignoring deployments for ${id}. The token is not valid anymore`
      );
      return;
    }

    throw err;
  });
  if (!deployments) return;

  deployments = deployments.filter(d => d.state === "READY");
  if (!deployments.length) return;

  const deploymentIds = deployments.map(d => d.uid);

  console.log(
    `getting existing deployment docs for ${id}: ${deploymentIds.length}`
  );

  const db = await mongo();
  const deploymentsCollection = db.collection("deployments");

  // deployment docs to audit
  const [existingDeploymentDocs, deploymentDocs] = await Promise.all([
    deploymentsCollection
      .find(
        {
          id: { $in: deploymentIds }
        },
        {
          projection: { id: 1 }
        }
      )
      .toArray(),
    deploymentsCollection
      .find(
        {
          ownerId: id,
          auditing: { $ne: null }
        },
        {
          projection: { id: 1, url: 1 }
        }
      )
      .toArray()
  ]);

  const existingIds = new Set(existingDeploymentDocs.map(d => d.id));
  deployments = deployments.filter(d => !existingIds.has(d.uid));

  const deploymentsToAudit = new Map([
    ...deployments.map(d => [d.uid, { id: d.uid, url: d.url }]),
    ...deploymentDocs.map(d => [d.id, { id: d.id, url: d.url }])
  ]);

  console.log(`auditing deployments: ${deploymentsToAudit.size}`);

  for (const d of deploymentsToAudit.values()) {
    await limitLighthouse();

    console.log(`requesting lighthouse: ${d.id}, ${d.url}`);

    runAudits({
      id: d.id,
      url: d.url,
      ownerId: id
    });
  }
}

async function handler(req, res) {
  const body = await rawBody(req);
  let json;

  try {
    json = JSON.parse(body);
  } catch (err) {
    res.statusCode = 400;
    res.end("Invalid JSON");
    return;
  }

  const owners = Array.isArray(json) ? json : [json];

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

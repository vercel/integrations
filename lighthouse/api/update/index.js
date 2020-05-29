const { timeout } = require("promise-timeout");
const auth = require("../../lib/auth");
const fetchApi = require("../../lib/fetch-api");
const mongo = require("../../lib/mongo");
const sleep = require("../../lib/sleep");
const findDeploymentsToAudit = require("../../lib/find-deployments-to-audit");
const maybeNotifyFloogingQueue = require("../../lib/maybe-notify-flooding-queue");

const handler = async (req, res) => {
  console.log(`invoking update`);

  const db = await timeout(mongo(), 5000);
  const deployments = await findDeploymentsToAudit(db);

  Promise.all([
    fetchApi("/update/users.js"),
    fetchApi("/update/teams.js"),
    fetchApi("/lighthouse", { deployments, startAt: Date.now() })
  ]).catch(console.error);

  await Promise.all([maybeNotifyFloogingQueue(db), sleep(500)]);

  res.end("ok");
};

module.exports = mongo.withClose(auth(handler));

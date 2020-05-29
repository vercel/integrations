const { timeout } = require("promise-timeout");
const { promisify } = require("util");
const mql = require("@microlink/mql");
const zlib = require("zlib");

const mongo = require("../../lib/mongo");
const auth = require("../../lib/auth");
const fetchApi = require("../../lib/fetch-api");
const findDeploymentsToAudit = require("../../lib/find-deployments-to-audit");
const sleep = require("../../lib/sleep");

const gzip = promisify(zlib.gzip);

const ReportGenerator = require("lighthouse/lighthouse-core/report/report-generator");

const WHITELIST_ERRORS = ["EBRWSRTIMEOUT", "EMAXREDIRECTS", "EINVALURLCLIENT"];

const getScores = categories =>
  Object.values(categories).reduce(
    (acc, category) => ({
      ...acc,
      [category.id]: category.score
    }),
    {}
  );

const createHandler = ({ gzip, mongo }) => async (req, res) => {
  const { deployments, startAt } = req.body || {};
  if (!Array.isArray(deployments) || typeof startAt !== "number") {
    res.statusCode = 400;
    res.end("Invalid JSON");
    return;
  }

  for (const d of deployments) {
    if (!d || !d.id || !d.url || !d.ownerId) {
      res.statusCode = 400;
      res.end("Missing required properties on deployment: id, url or ownerId");
      return;
    }
  }

  const results = await Promise.all(
    deployments.map(async ({ url }) => {
      const startedAt = Date.now();
      console.log(`generating report: ${url}`);
      try {
        const { data } = await mql(`https://${url}`, {
          apiKey: process.env.MICROLINK_API_KEY,
          ttl: process.env.MICROLINK_API_KEY ? "30d" : undefined,
          meta: false,
          retry: 3,
          filter: "insights",
          insights: {
            technologies: false,
            lighthouse: {
              maxWaitForload: 10000
            }
          }
        });
        console.log(
          `finished to generate report after ${Date.now() -
            startedAt}ms: ${url}`
        );

        const report = data.insights.lighthouse;
        return { report };
      } catch (err) {
        console.error(
          `errored to generate report after ${Date.now() -
            startedAt}ms: ${url} (${
            err.headers ? err.headers["x-request-id"] : "none"
          })`
        );
        if (WHITELIST_ERRORS.includes(err.code)) {
          console.log(`error: ${err.code} ${url}`);
          const lhError = err.code;
          return { lhError };
        } else {
          console.error(`fatal: ${url}`, err);
          return;
        }
      }
    })
  );

  let operations = await Promise.all(
    deployments.map(async ({ id, url, ownerId }, i) => {
      const result = results[i];
      if (!result) return;

      let report;
      let scores;
      let lhError;
      if (result.report) {
        scores = getScores(result.report.categories);
        report = await gzip(ReportGenerator.generateReportHtml(result.report));
      } else {
        lhError = result.lhError;
      }

      return {
        updateOne: {
          filter: { id },
          update: {
            $set: {
              id,
              url,
              ownerId,
              scores,
              report,
              lhError,
              auditing: null
            },
            $setOnInsert: {
              createdAt: Date.now()
            }
          },
          upsert: true
        }
      };
    })
  );
  operations = operations.filter(Boolean);

  const db = await timeout(mongo(), 5000);
  if (operations.length) {
    console.log(`saving deployments: ${operations.length}`);
    await db.collection("deployments").bulkWrite(operations);
  }

  if (Date.now() - startAt < 50 * 1000) {
    const nextDeployments = await findDeploymentsToAudit(db);
    if (nextDeployments.length) {
      fetchApi("/lighthouse", { deployments: nextDeployments, startAt }).catch(
        console.error
      );
      await sleep(500);
    }
  }

  res.end("ok");
};

const withTime = fn => {
  return async function(req, res) {
    console.time(req.url);
    try {
      return await fn.call(this, req, res);
    } finally {
      console.timeEnd(req.url);
    }
  };
};

module.exports = mongo.withClose(
  auth(
    withTime(
      createHandler({
        mongo,
        gzip
      })
    )
  )
);
module.exports.createHandler = createHandler;

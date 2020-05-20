const { timeout } = require("promise-timeout");
const { promisify } = require("util");
const mql = require("@microlink/mql");
const zlib = require("zlib");

const mongo = require("../../lib/mongo");
const auth = require("../../lib/auth");

const gzip = promisify(zlib.gzip);

const ReportGenerator = require("lighthouse/lighthouse-core/report/report-generator");

const WHITELIST_ERRORS = ["EBRWSRTIMEOUT", "EMAXREDIRECTS"];

const getScores = categories =>
  Object.values(categories).reduce(
    (acc, category) => ({
      ...acc,
      [category.id]: category.score
    }),
    {}
  );

const createHandler = ({ gzip, mongo }) => async (req, res) => {
  if (!Array.isArray(req.body)) {
    res.statusCode = 400;
    res.end("Invalid JSON");
    return;
  }

  for (const data of req.body) {
    if (!data || !data.id || !data.url || !data.ownerId) {
      res.statusCode = 400;
      res.end("Missing required properties: id, url or ownerId");
      return;
    }
  }

  const deployments = req.body;
  const results = await Promise.all(
    deployments.map(async ({ id, url }) => {
      console.log(`generating report: ${id}, ${url}`);
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

        const report = data.insights.lighthouse;
        return { report };
      } catch (err) {
        if (WHITELIST_ERRORS.includes(err.code)) {
          console.log(`error: ${err.code} ${id}, ${url}`);
          const lhError = err.code;
          return { lhError };
        } else {
          console.error(`fatal: ${id}, ${url}`, err);
          return;
        }
      }
    })
  );

  const operations = await Promise.all(
    deployments.map(async ({ id, url, ownerId }, i) => {
      const result = results[i];
      if (!result) return;

      console.log(`saving deployment: ${id}, ${url}`);

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

  const db = await timeout(mongo(), 5000);
  await db.collection("deployments").bulkWrite(operations.filter(Boolean));
  res.end("ok");
};

module.exports = mongo.withClose(
  auth(
    createHandler({
      mongo,
      gzip
    })
  )
);
module.exports.createHandler = createHandler;

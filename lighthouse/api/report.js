const { parse } = require("url");
const mongo = require("../lib/mongo");

module.exports = mongo.withClose(async (req, res) => {
  const {
    query: { url }
  } = parse(req.url, true);
  if (!url) {
    res.statusCode = 400;
    res.end("missing the url query parameter");
    return;
  }

  console.log("getting deployment doc");
  const db = await mongo();
  const deploymentDoc = await db.collection("deployments").findOne(
    { url },
    {
      projection: {
        report: 1,
        lhError: 1
      }
    }
  );
  mongo.close().catch(console.error);

  if (!deploymentDoc) {
    res.statusCode = 404;
    res.end("not found");
    return;
  }

  if (deploymentDoc.lhError) {
    res.statusCode = 400;
    res.end(deploymentDoc.reportError);
    return;
  }

  if (!deploymentDoc.report) {
    res.statusCode = 200;
    res.end("auditing...");
    return;
  }

  res.setHeader("Content-Encoding", "gzip");
  res.setHeader("Content-Type", "text/html");
  res.end(deploymentDoc.report.buffer);
});

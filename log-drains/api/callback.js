const { parse } = require("url");
const { HOST } = require("../lib/env");
const createLogDrain = require("../lib/create-log-drain");
const getAccessToken = require("../lib/get-access-token");
const getLogDrains = require("../lib/get-log-drains");

const JSON_HTTPS_DRAIN_URL = `${HOST}/api/drain`;

module.exports = async (req, res) => {
  const {
    query: { code, next, teamId }
  } = parse(req.url, true);

  if (!code) {
    res.statusCode = 400;
    res.end("missing query parameter: code");
    return;
  }

  console.log("getting accessToken");
  const accessToken = await getAccessToken({
    code,
    redirectUri: `${HOST}/api/callback`
  });

  console.log("getting existing log drains");
  const logDrains = await getLogDrains({ accessToken, teamId });
  const hasJsonHttpsDrain = logDrains.some(d => d.url === JSON_HTTPS_DRAIN_URL);
  if (!hasJsonHttpsDrain) {
    console.log("creating a new log drain of json-https");
    await createLogDrain({
      accessToken,
      name: "log-drain-integration-json-https",
      teamId,
      type: "json-https",
      url: JSON_HTTPS_DRAIN_URL
    });
  }

  res.statusCode = 302;
  res.setHeader("Location", next);
  res.end();
};

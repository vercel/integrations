const { parse } = require("url");
const { HOST } = require("./lib/env");
const createLogDrain = require("./lib/create-log-drain");
const getAccessToken = require("./lib/get-access-token");
const getLogDrains = require("./lib/get-log-drains");

const DRAIN_URL = `${HOST}/drain.js`;

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
    redirectUri: `${HOST}/callback.js`
  });

  console.log("getting existing log drains");
  const logDrains = await getLogDrains({ accessToken, teamId });
  const hasDrain = logDrains.some(d => d.url === DRAIN_URL);
  if (!hasDrain) {
    console.log("creating a new log drain");
    await createLogDrain({
      accessToken,
      name: "Log drain integration",
      teamId,
      type: "now-https-json",
      url: DRAIN_URL
    });
  }

  res.statusCode = 302;
  res.setHeader("Location", next);
  res.end();
};

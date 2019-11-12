const createLogDrain = require("../lib/create-log-drain");
const getMetadata = require("../lib/get-metadata");
const route = require("../lib/route");

module.exports = async arg => {
  const { payload } = arg;
  const { clientState, configurationId, teamId, token } = payload;
  const { name, type, url } = clientState;

  console.log("getting metadata");
  const metadata = await getMetadata({ configurationId, token, teamId });

  console.log("creating a new log drain");
  try {
    await createLogDrain(
      {
        token: metadata.token,
        teamId
      },
      {
        name,
        type,
        url
      }
    );
  } catch (err) {
    if (err.body && err.body.error) {
      return route(arg, "GET /drains/new", {
        errorMessage: err.body.error.message
      });
    } else {
      throw err;
    }
  }

  return route(arg, "GET /drains");
};

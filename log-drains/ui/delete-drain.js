const { htm } = require("@zeit/integration-utils");
const deleteLogDrain = require("../lib/delete-log-drain");
const getMetadata = require("../lib/get-metadata");
const route = require("../lib/route");

module.exports = async (arg, { params }) => {
  const { payload } = arg;
  const { clientState, configurationId, teamId, token } = payload;

  console.log("Getting metadata");
  const metadata = await getMetadata({ configurationId, token, teamId });

  console.log("Deleting log drain: ${id}");
  const state = {};
  try {
    await deleteLogDrain({
      token: metadata.token,
      teamId
    }, {
      id: params.drainId
    });
  } catch (err) {
    if (err.body && err.body.error) {
      state.errorMessage = err.body.error.message;
    } else {
      throw err;
    }
  }

  return route(arg, "GET /drains", state);
};

const deleteLogDrain = require("../lib/delete-log-drain");
const getMetadata = require("../lib/get-metadata");
const route = require("../lib/route");

module.exports = async (arg, { params }) => {
  const { payload } = arg;
  const { configurationId, teamId, token } = payload;

  console.log("Getting metadata");
  const metadata = await getMetadata({ configurationId, token, teamId });

  console.log(`Deleting log drain: ${params.id}`);
  const state = {};
  try {
    await deleteLogDrain(
      {
        token: metadata.token,
        teamId
      },
      {
        id: params.id
      }
    );
  } catch (err) {
    if (err.body && err.body.error) {
      state.errorMessage = err.body.error.message;
    } else {
      throw err;
    }
  }

  return route(arg, "list-drains", state);
};

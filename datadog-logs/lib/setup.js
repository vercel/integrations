const createLogDrain = require("./create-log-drain");
const getMetadata = require("./get-metadata");
const { DATADOG_HOSTS } = require("./constants");

module.exports = async function setup({
  clientState,
  configurationId,
  project,
  teamId,
  token
}) {
  const key = (clientState.key || "").trim();
  if (!key) {
    return { errorMessage: `API Key is required` };
  }

  console.log("getting metadata", configurationId);
  const metadata = await getMetadata({ configurationId, teamId, token });
  const host = DATADOG_HOSTS[clientState.region] || DATADOG_HOSTS.us;

  let drain;
  let errorMessage;
  console.log("creating a new log drain", configurationId);
  try {
    drain = await createLogDrain(
      {
        token: metadata.token,
        teamId
      },
      {
        name: "Datadog drain",
        type: "json",
        url: `https://http-intake.logs.${host}/v1/input/${encodeURIComponent(
          key
        )}?ddsource=vercel`,
        projectId: project ? project.id : null
      }
    );
  } catch (err) {
    console.error("Failed to create log drain", configurationId, err);
    errorMessage =
      err.body && err.body.error ? err.body.error.message : err.message;
  }

  return { drain, errorMessage };
};

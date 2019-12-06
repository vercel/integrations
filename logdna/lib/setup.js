const createLogDrain = require("./create-log-drain");
const getMetadata = require("./get-metadata");

module.exports = async ({
  clientState,
  configurationId,
  project,
  teamId,
  token
}) => {
  const url = (clientState.url || "").trim();
  if (!url) {
    return { errorMessage: "URL is required" };
  }

  console.log("getting metadata");
  const metadata = await getMetadata({
    clientState,
    configurationId,
    teamId,
    token
  });

  let drain;
  let errorMessage;
  console.log("creating a new log drain");
  try {
    drain = await createLogDrain(
      {
        token: metadata.token,
        teamId
      },
      {
        name: "LogDNA drain",
        type: "syslog",
        url: `syslog+tls://${url}`,
        projectId: project ? project.id : null
      }
    );
  } catch (err) {
    console.error("Failed to create log drain", err);
    errorMessage =
      err.body && err.body.error ? err.body.error.message : err.message;
  }

  return { drain, errorMessage };
};

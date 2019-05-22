const { withUiHook, htm } = require("@zeit/integration-utils");

const newClusterView = require("./views/new-cluster");
const dashboardView = require("./views/dashboard");
const setupView = require("./views/setup");

async function getContent(options) {
  const { payload, zeitClient } = options;
  const { clientState, action } = payload;

  const metadata = await zeitClient.getMetadata();

  const viewInfo = { metadata, zeitClient, payload };

  console.log("VIEW INFO:", viewInfo);

  if (!metadata.accessToken) {
    return setupView(viewInfo);
  }

  if (action === "new-cluster" || action === "create-cluster") {
    return newClusterView(viewInfo);
  }

  return dashboardView(viewInfo);
}

async function handler(options) {
  const jsx = await getContent(options);
  return htm`<Page>${jsx}</Page>`;
}

module.exports = withUiHook(handler);

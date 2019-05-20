const { withUiHook, htm } = require("@zeit/integration-utils");

const setupView = require("./views/setup");

async function getContent(options) {
  const { payload, zeitClient } = options;
  const { actions } = payload;
  const viewInfo = { zeitClient, payload };

  console.log("viewInfo:", viewInfo);

  return setupView(viewInfo);
}

async function handler(options) {
  const jsx = await getContent(options);
  return htm`<Page>${jsx}</Page>`;
}

module.exports = withUiHook(handler);

const { withUiHook, htm } = require("@zeit/integration-utils");
const { fetchAndDeploy } = require("./lib/utils");

const currentDir = process.cwd();

async function getContent(options) {
  const { payload, zeitClient } = options;
  const { actions } = payload;
  const { token } = zeitClient.options;
  const viewInfo = { zeitClient, payload };

  console.log("CWD:", currentDir);

  const { url } = await fetchAndDeploy(token, currentDir);

  return htm`
    <Box>
      <H1>ACME Starter Kit</H1>
      <Link href="${url}">${url}</Link>
    </Box>
  `;
}

async function handler(options) {
  const jsx = await getContent(options);
  return htm`<Page>${jsx}</Page>`;
}

module.exports = withUiHook(handler);

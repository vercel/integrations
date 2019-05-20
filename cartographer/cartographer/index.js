const { execFileSync } = require('child_process');
const generateDotFile = require('./generate.js');
const micro = require('micro');
const path = require('path');
const { withUiHook, htm } = require('@zeit/integration-utils');

const handler = withUiHook(async ({ zeitClient }) => {
  const dotFile = await generateDotFile(zeitClient);
  console.error('generating svg file');
  const svgBuffer = execFileSync(path.join(__dirname, 'dot_static'), [ '-Tsvg' ], { input: dotFile });
  const svgBase64 = svgBuffer.toString('base64');
  const src = `data:image/svg+xml;base64,${svgBase64}`;

  const content = htm`
    <Page>
      <Img src="${src}" />
    </Page>
  `;

  return content;
});

const server = micro(handler);
const port = process.env.PORT || 5005;
server.listen(port);

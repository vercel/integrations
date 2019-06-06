const micro = require('micro');
const { withUiHook, htm } = require('@zeit/integration-utils');

const renderUIHook = withUiHook(() => {
  console.log('UIHook loaded.');
  return htm`
		<Page>
			<H1>Delete Hooks - Redirect URI example</H1>
		</Page>
	`;
});

module.exports = function(req, res) {
  if (req.method === 'DELETE') {
    console.log('Configuration has been deleted. Do some cleanup tasks here.');
    return micro.send(res, 200, {});
  }

  return renderUIHook(req, res);
};

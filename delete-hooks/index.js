const {withUiHook, htm} = require('@zeit/integration-utils');

module.exports = withUiHook(({payload}) => {
	return htm`
		<Page>
			<Box textAlign="center">
				Remove the configuration to recieve the delete hook.
			</Box>
		</Page>
	`
});

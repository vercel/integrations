const {htm} = require('@zeit/integration-utils');

module.exports = function ProjectsSwitcher() {
	return htm`
		<Box textAlign="right">
			<ProjectSwitcher />
		</Box>
	`;
};

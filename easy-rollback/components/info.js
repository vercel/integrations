const {htm} = require('@zeit/integration-utils');

module.exports = ({children}) => htm`
	<Box padding="10px" textAlign="center">
		${children}
	</Box>
`;

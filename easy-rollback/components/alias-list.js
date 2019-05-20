const {htm} = require('@zeit/integration-utils');

module.exports = ({aliases}) => htm`
	<Box marginTop="10px">
		<UL>
			${aliases.map((a) => htm`<LI><Link href=${`https://${a.alias}`} target="_blank">${a.alias}</Link></LI>`)}
		</UL>
	</Box>
`;

const {htm} = require('@zeit/integration-utils');

module.exports = ({aliases}) => htm`
	<Box marginTop="10px">
		<UL>
			${aliases.map((a) => htm`
				<Box display="flex" alignItems="center">
					<Checkbox name=${`alias.${a.alias}`} checked=${true} />
					<Box marginLeft="5px">
						<Link href=${`https://${a.alias}`} target="_blank">${a.alias}</Link>
					</Box>
				</Box>
			`)}
		</UL>
	</Box>
`;

const {htm} = require('@zeit/integration-utils');
const AliasList = require('../components/alias-list');

module.exports = function confirmView({payload, metadata}) {
	const deploymentId = payload.action.replace('confirm/', '');
	const cache = metadata.cache[payload.projectId];
	const deployment = cache.oldDeployments.find((d) => d.id === deploymentId);
	const url = `https://${deployment.url}`;
	return htm`
		<Page>
			<Fieldset>
				<FsContent>
					<H1>Confirm The Rollback</H1>
					The deployment <Link href=${url} target="_blank">${url}</Link> will be assigned to following aliases:
					<${AliasList} aliases=${cache.aliases} //>
				</FsContent>
				<FsFooter>
					<Box>
						<Button small action=${`rollback/${deploymentId}`}>Confirm</Button>
						<Button small secondary action="view">Cancel</Button>
					</Box>
				</FsFooter>
			</Fieldset>
		</Page>
	`;
};

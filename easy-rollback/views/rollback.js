const AliasList = require('../components/alias-list');
const {htm} = require('@zeit/integration-utils');

module.exports = async function confirmView({payload, zeitClient, metadata}) {
	const deploymentId = payload.action.replace('rollback/', '');
	const cache = metadata.cache[payload.projectId];
	const deployment = cache.oldDeployments.find((d) => d.id === deploymentId);

	const aliasDeployment = (alias) => zeitClient.fetchAndThrow(
		`/v2/now/deployments/${deploymentId}/aliases`,
		{
			method: 'POST',
			data: {alias}
		}
	);
	await Promise.all(cache.aliases.map((a) => aliasDeployment(a.alias)));
	delete metadata.cache[payload.projectId];
	await zeitClient.setMetadata(metadata);

	const url = `https://${deployment.url}`;

	return htm`
		<Page>
			<Fieldset>
				<FsContent>
					<H1>Successfully Aliased</H1>
					The deployment with url: <Link href=${url} target="_blank">${url}</Link> has aliased to:
					<${AliasList} aliases=${cache.aliases} //>
				</FsContent>
				<FsFooter>
					<Button small action="view">Show Alias History</Button>
				</FsFooter>
			</Fieldset>
		</Page>
	`;
};


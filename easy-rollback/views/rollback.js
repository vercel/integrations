const AliasList = require('../components/alias-list');
const {htm} = require('@zeit/integration-utils');

function getSelectedAliases(clientState) {
	const aliases = Object.keys(clientState)
		.filter((key) => /^alias\./.test(key))
		.filter((key) => clientState[key])
		.map((key) => key.replace('alias.', ''));

	return aliases;
}

module.exports = async function confirmView({payload, zeitClient, metadata}) {
	const deploymentId = payload.action.replace('rollback/', '');
	const cache = metadata.cache[payload.projectId];
	const deployment = cache.oldDeployments.find((d) => d.id === deploymentId);

	const aliases = getSelectedAliases(payload.clientState);
	if (aliases.length === 0) {
		return htm`
			<Page>
				<Fieldset>
					<FsContent>
						<H1>Aliasing Aborted</H1>
						No alias selected for the rollback.
					</FsContent>
					<FsFooter>
						<Button small action="view">Show Alias History</Button>
					</FsFooter>
				</Fieldset>
			</Page>
		`;
	}

	const aliasDeployment = async (alias) => {
		const response = await zeitClient.fetch(
			`/v2/now/deployments/${deploymentId}/aliases`,
			{
				method: 'POST',
				data: {alias}
			}
		);


		if (response.status === 200 || response.status === 409) {
			return;
		}

		throw new Error(`failed to alias: ${alias} to deployment: ${deploymentId} - ${await response.text()}`);
	};

	await Promise.all(aliases.map((a) => aliasDeployment(a)));
	delete metadata.cache[payload.projectId];
	await zeitClient.setMetadata(metadata);

	const url = `https://${deployment.url}`;

	return htm`
		<Page>
			<Fieldset>
				<FsContent>
					<H1>Successfully Aliased</H1>
					The deployment with url: <Link href=${url} target="_blank">${url}</Link> has aliased to:
					<${AliasList} aliases=${aliases.map((a) => ({alias: a}))} //>
				</FsContent>
				<FsFooter>
					<Button small action="view">Show Alias History</Button>
				</FsFooter>
			</Fieldset>
		</Page>
	`;
};


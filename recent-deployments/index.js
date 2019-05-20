const {withUiHook, htm} = require('@zeit/integration-utils');

const UrlItem = ({href}) => htm`
	<LI><Link href=${href} target="_blank">${href}</Link></LI>
`

module.exports = withUiHook(async ({payload, zeitClient}) => {
	const {projectId} = payload;
	let apiUrl = `/v4/now/deployments?limit=10`;
	if (projectId) {
		apiUrl += `&projectId=${projectId}`
	}

	const {deployments} = await zeitClient.fetchAndThrow(apiUrl, {method: 'GET'});
	const urls = deployments.map(d => `https://${d.url}`)

	return htm`
		<Page>
			<H1>Recent deployments on this ${projectId? 'project' : 'account'}</H1>
			<UL>
				${urls.map(u => htm`<${UrlItem} href=${u} //>`)}
			</UL>
		</Page>
	`
});

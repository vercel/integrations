const { withUiHook, htm } = require('@zeit/integration-utils');
const ms = require('ms');
const findAliases = require('./actions/find-aliases');
const findAliasHistory = require('./actions/find-alias-history');
const confirmView = require('./views/confirm');
const rollbackView = require('./views/rollback');
const dashboardView = require('./views/dashboard');
const Info = require('./components/info');

async function fetchData({payload}) {
	const { projectId, user, team } = payload;
	const aliases = await findAliases({projectId, user, team});
	const history = await findAliasHistory({aliases});

	const latestDeployment = history[0];
	const oldDeployments = history.slice(1);

	return {aliases, oldDeployments, latestDeployment};
}

function shouldUpdateCache({payload, metadata}) {
	const projectCache = metadata.cache[payload.projectId];
	if (!projectCache) {
		return true;
	}

	if (payload.action === 'reload') {
		return true;
	}

	if ((Date.now() - payload.createdAt) > ms('30min')) {
		return true;
	}

	return false;
}

module.exports = withUiHook(async ({payload, zeitClient}) => {
	const {projectId} = payload;
	if (!projectId) {
		return htm`
			<Page>
				<${Info}>Select a project to show rollback information: <ProjectSwitcher/><//>
			</Page>
		`;
	}

	const metadata = await zeitClient.getMetadata();
	metadata.cache = metadata.cache || {};
	if (shouldUpdateCache({payload, metadata})) {
		const {aliases, oldDeployments, latestDeployment} = await fetchData({payload});
		metadata.cache[projectId] = {aliases, oldDeployments, latestDeployment, createdAt: Date.now()};
		await zeitClient.setMetadata(metadata);
	}

	if (/confirm\//.test(payload.action)) {
		return confirmView({payload, zeitClient, metadata});
	}

	if (/rollback\//.test(payload.action)) {
		return rollbackView({payload, zeitClient, metadata});
	}

	return dashboardView({payload, zeitClient, metadata});
});

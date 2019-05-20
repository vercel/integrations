const cosmos = require('../lib/cosmos');

module.exports = async function findAliasedDeployments({aliases}) {
	if (aliases.length === 0) {
		return [];
	}

	const eventsList = await Promise.all(aliases.map((alias) => {
		const query = `SELECT TOP 10 * FROM c WHERE c.type = "alias" and c.payload.alias=@alias ORDER BY c.created DESC`;
		return cosmos.queryDocuments(
			cosmos.userEventsLink,
			query,
			{alias: alias.alias},
			{enableCrossPartitionQuery: true}
		);
	}));

	const deploymentsMap = {};
	eventsList.forEach((list) => {
		list.forEach((e) => {
			const deploymentId = e.payload.deployment.id;
			deploymentsMap[deploymentId] = deploymentsMap[deploymentId] || {...e.payload.deployment};
			const deployment = deploymentsMap[deploymentId];

			const createdAt = e.createdAt || e.created;
			if (!deployment.createdAt || deployment.createdAt < createdAt) {
				deployment.createdAt = createdAt;
			}
		});
	});

	const deployments = Object.keys(deploymentsMap)
		.map((id) => deploymentsMap[id])
		.sort((a, b) => b.createdAt - a.createdAt);

	return deployments;
};

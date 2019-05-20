const cosmos = require('../lib/cosmos');
const ms = require('ms');

async function getUsernames({team, user}) {
	if (team) {
		const {members} = await cosmos.getDocumentById(cosmos.accessDirectoryLink, team.id);
		const users = await Promise.all(members.map(
			(m) => cosmos.getDocumentById(cosmos.accessDirectoryLink, m.uid)
		));

		return users.map((u) => u.username);
	}

	return [user.username];
}

module.exports = async function findAliases({projectId, team, user}) {
	const aliases = await cosmos.queryDocuments(
		cosmos.aliasesLink,
		`SELECT TOP 100 * FROM c WHERE c.projectId=@projectId ORDER BY c.created DESC`,
		{projectId},
		{enableCrossPartitionQuery: true}
	);

	const usernames = await getUsernames({team, user});

	const filteredAliases = aliases
		// remove branch aliases
		.filter((a) => !a.alias.includes('-git-'))
		// remove older aliases
		.filter((a) => (Date.now() - a.created) < ms('30 days'))
		// remove user aliases
		.filter((a) => {
			for (const username of usernames) {
				// This is for team member alias removal
				if (a.alias.includes(`-${username}.`)) {
					return false;
				}

				// This is for user level alias removal
				if (a.alias.includes(`.${username}.`)) {
					return false;
				}
			}
			return true;
		});

	return filteredAliases;
};

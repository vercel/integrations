const { htm } = require('@zeit/integration-utils');
const ms = require('ms');
const Info = require('../components/info');
const ProjectSwitcher = require('../components/project-switcher');

const AliasList = ({aliases}) => htm`
		<Box>
			Aliased to:
			${aliases.map((a, index) => htm`
				<Link href=${`https://${a.alias}`} target="_blank">${a.alias}</Link>
				${index < aliases.length - 1 ? ',' : ''}
			`)}
		</Box>
	`;

const GitHubInformation = ({deployment}) => {
	if (!deployment.meta || !deployment.meta.githubDeployment) {
		return '';
	}

	const gh = deployment.meta;
	const login = gh.githubCommitAuthorLogin;
	const commitUrl = `https://github.com/${gh.githubCommitOrg}/${gh.githubCommitRepo}/commit/${gh.githubCommitSha}`;
	const commitMessage = gh.githubCommitMessage.length < 50
		? gh.githubCommitMessage
		: `${gh.githubCommitMessage.substr(0, 50)} ...`;

	return htm`
		<Box>
			authored by <Link href=${`https://github.com/${login}`} target="_blank">${login}</Link> with
			<Link href=${commitUrl} target="_blank">${commitMessage}</Link>
		</Box>
	`;
};

const Deployment = ({deployment, dontRollback}) => {
	const url = `https://${deployment.url}`;

	return htm`
		<Box padding="10px 15px" marginBottom="10px" backgroundColor="#FFF" border="1px solid #f5f5f5" borderRadius="3px">
			<Box display="flex" justifyContent="space-between">
				<Link href=${url} target="_blank">${url}</Link>
				${dontRollback ? '' : htm`<Button small action=${`confirm/${deployment.id}`}>Rollback</Button>`}
			</Box>
			<Box fontSize="12px" lineHeight="16px">
				<Box>
					aliased ${ms(Date.now() - deployment.createdAt, {'long': true})} ago
				</Box>
				<${GitHubInformation} deployment=${deployment}//>
			</Box>
		</Box>
	`;
};

const LatestDeployment = ({deployment}) => {
	const url = `https://${deployment.url}`;

	return htm`
		<Box>
			<Box display="flex" justifyContent="space-between">
				<Link href=${url} target="_blank">${url}</Link>
			</Box>
			<Box fontSize="14px" lineHeight="20px">
				<Box>
					aliased ${ms(Date.now() - deployment.createdAt, {'long': true})} ago
				</Box>
				<${GitHubInformation} deployment=${deployment}//>
			</Box>
		</Box>
	`;
};

module.exports = function dashboardView({payload, metadata}) {
	const {project} = payload;
	const {aliases, oldDeployments, latestDeployment} = metadata.cache[project.id];

	if (!latestDeployment) {
		return htm`
			<Page>
				<${ProjectSwitcher} //>
				<${Info}>
					No production alias found for this project.
				<//>
			</Page>
		`;
	}

	return htm`
		<Page>
			<${ProjectSwitcher} //>
			<Fieldset>
				<FsContent>
					<H1>Aliased Deployment</H1>
					<${LatestDeployment} deployment=${latestDeployment}//>
				</FsContent>
				<FsFooter>
					<${AliasList} aliases=${aliases} //>
				</FsFooter>
			</Fieldset>
			<H2>Alias History</H2>
			${oldDeployments.map((deployment) => htm`<${Deployment} deployment=${deployment} //>`)}
			<AutoRefresh action="reload" timeout=${payload.action === 'reload' ? ms('15min') : ms('5secs')}/>
		</Page>
	`;
};

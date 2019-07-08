import { Components } from '@zeit/api-types';
import path from './path';

export default function getDeploymentContext(
	deployment?: Components.Schemas.Deployment
) {
	if (deployment) {
		// When there is a Github deployment we assume there is more metadata
		const githubDeployment = path(deployment, 'meta.githubDeployment');
		if (githubDeployment) {
			const {
				githubOrg,
				githubRepo,
				githubPrId,
				githubCommitOrg,
				githubCommitRepo,
				githubCommitSha,
				githubCommitRef
			} = deployment.meta;

			if (githubCommitSha) {
				const prLink = githubPrId
					? `https://github.com/${githubOrg}/${githubRepo}/pull/${githubPrId}`
					: null;
				const commitUrl = `https://github.com/${githubCommitOrg}/${githubCommitRepo}/commit/${githubCommitSha}`;
				const refUrl = `https://github.com/${githubCommitOrg}/${githubCommitRepo}/tree/${githubCommitRef}`;
				const sha = githubCommitSha.substring(0, 7);
				return `from Github commit <${commitUrl}|${sha}> in ${
					githubOrg !== githubCommitOrg && githubPrId
						? `forked <${prLink}|PR${githubPrId}>`
						: `branch <${refUrl}|${githubCommitRef}>`
				}`;
			}
		}

		// When there is a Gitlab deployment we assume there is more metadata
		const gitlabDeployment = path(deployment, 'meta.gitlabDeployment');
		if (gitlabDeployment && deployment.meta.gitlabCommitSha) {
			const sha = deployment.meta.gitlabCommitSha.substr(0, 7);
			const refUrl = `https://gitlab.com/${
				deployment.meta.gitlabProjectPath
			}/tree/${encodeURIComponent(deployment.meta.gitlabCommitRef!)}`;
			const commitUrl = `https://gitlab.com/${deployment.meta.gitlabProjectPath}/commit/${deployment.meta.gitlabCommitSha}`;
			return `from Github commit <${commitUrl}|${sha}> in branch <${refUrl}|${deployment.meta.gitlabCommitRef}>`;
		}
	}

	return `manually from API`;
}

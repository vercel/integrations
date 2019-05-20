import { Event, ZeitClient, TeamMember, CurrentUser } from '../../zeit-client';
import getEventUser from '../get-event-user';

interface DeploymentPayload {
	deploymentId: string;
	name: string;
	project: string;
	url: string;
	plan: string;
	regions: string[];
	type: 'LAMBDAS' | 'NPM' | 'DOCKER';
	deployment?: object;
}

interface GithubDeployment extends DeploymentPayload {
	deployment: {
		id: string;
		name: string;
		url: string;
		meta: {
			githubDeployment: string;
			githubOrg?: string;
			githubRepo?: string;
			githubPrId?: string;
			githubCommitOrg?: string;
			githubCommitRepo?: string;
			githubCommitRef?: string;
			githubCommitSha?: string;
			githubCommitMessage?: string;
			githubCommitAuthorLogin?: string;
			githubCommitAuthorName?: string;
		};
	};
}

interface GitlabDeployment extends DeploymentPayload {
	deployment: {
		id: string;
		name: string;
		url: string;
		meta: {
			gitlabCommitAuthorAvatar?: string;
			gitlabCommitRef?: string;
			gitlabCommitSha?: string;
			gitlabDeployment?: string;
			gitlabProjectPath?: string;
		};
	};
}

export default async function formatDeploymentEvent(
	zeit: ZeitClient,
	event: Event<DeploymentPayload>
) {
	const user = await getEventUser(zeit, event.userId);
	const team = zeit.teamId ? await zeit.getTeam() : null;
	const username = getUserDisplayName(event, user);
	const deployContext = getDeployContext(event);
	const avatar = getUserAvatar(event, user);
	const projectUrl = team
		? `https://zeit.co/${team.slug}/${event.payload.name}`
		: `https://zeit.co/${username}/${event.payload.name}`;

	return {
		text: `The project *${event.payload.name}* was deployed to <https://${
			event.payload.url
		}|${event.payload.url}>`,
		attachments: [
			{
				author_icon: avatar,
				author_name: `${username}${
					team ? ` from ${team.name} team` : ``
				}`,
				fallback: `The user *${username}* deployed ${
					event.payload.name
				} to ${event.payload.url}`,
				footer: deployContext,
				text: `Visit more <${projectUrl}|details> of the project or check out the <https://${
					event.payload.url
				}/_logs|build logs>.`,
				title_link: `https://${event.payload.url}`,
				title: event.payload.url,
				ts: (event.createdAt || Date.now()) / 1000
			}
		]
	};
}

function isGithubPayload(payload: any): payload is GithubDeployment {
	return (
		payload.deployment &&
		payload.deployment.meta &&
		payload.deployment.meta.githubDeployment
	);
}

function isGitlabDeployment(payload: any): payload is GitlabDeployment {
	return (
		payload.deployment &&
		payload.deployment.meta &&
		payload.deployment.meta.gitlabDeployment
	);
}

function getDeployContext(event: Event<DeploymentPayload>) {
	// This is a GitHub deployment
	if (isGithubPayload(event.payload)) {
		const {
			githubOrg,
			githubRepo,
			githubPrId,
			githubCommitOrg,
			githubCommitRepo,
			githubCommitSha,
			githubCommitRef
		} = event.payload.deployment.meta;

		const viaFork = githubOrg !== githubCommitOrg;
		let prLink;
		let commitUrl;
		let sha;
		let refUrl;

		if (githubCommitSha) {
			prLink = githubPrId
				? `https://github.com/${githubOrg}/${githubRepo}/pull/${githubPrId}`
				: null;
			commitUrl = `https://github.com/${githubCommitOrg}/${githubCommitRepo}/commit/${githubCommitSha}`;
			refUrl = `https://github.com/${githubCommitOrg}/${githubCommitRepo}/tree/${githubCommitRef}`;
			sha = githubCommitSha.substring(0, 7);
			return `from Github commit <${commitUrl}|${sha}> in ${
				viaFork && githubPrId
					? `forked <${prLink}|PR${githubPrId}>`
					: `branch <${refUrl}|${githubCommitRef}>`
			}`;
		}
	}

	// This is a GitLab deployment
	if (isGitlabDeployment(event.payload)) {
		const gl = event.payload.deployment.meta;
		let commitUrl;
		let sha;
		let refUrl;

		if (gl.gitlabCommitSha) {
			sha = gl.gitlabCommitSha.substr(0, 7);
			refUrl = `https://gitlab.com/${
				gl.gitlabProjectPath
			}/tree/${encodeURIComponent(gl.gitlabCommitRef!)}`;
			commitUrl = `https://gitlab.com/${gl.gitlabProjectPath}/commit/${
				gl.gitlabCommitSha
			}`;

			return `from Github commit <${commitUrl}|${sha}> in branch <${refUrl}|${
				gl.gitlabCommitRef
			}>`;
		}
	}

	return `manually from API`;
}

function getUserDisplayName(
	event: Event<DeploymentPayload>,
	user?: TeamMember | CurrentUser
) {
	if (isGithubPayload(event.payload)) {
		return event.payload.deployment.meta.githubCommitAuthorLogin;
	}

	return user ? user.username : event.userId;
}

function getUserAvatar(
	event: Event<DeploymentPayload>,
	eventUser?: TeamMember | CurrentUser
) {
	if (isGitlabDeployment(event.payload)) {
		return event.payload.deployment.meta.gitlabCommitAuthorAvatar;
	}

	if (isGithubPayload(event.payload)) {
		return `https://avatars.githubusercontent.com/${
			event.payload.deployment.meta.githubCommitAuthorLogin
		}?size=50`;
	}

	if (eventUser && eventUser.username) {
		return `https://zeit.co/api/www/avatar/?u=${eventUser.username}&s=50`;
	}

	return null;
}

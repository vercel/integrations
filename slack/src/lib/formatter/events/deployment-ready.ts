import { Components } from '@zeit/api-types';
import { ZeitClient } from '../../zeit-client';
import getEventUser from '../get-event-user';
import getUserAvatar from '../get-user-avatar';
import getUserDisplayName from '../get-user-display-name';
import getDeploymentContext from '../get-deployment-context';
import getDeploymentDasboardURL from '../get-deployment-dashboard-url';
import getProjectURL from '../get-project-url';

export default async function formatDeploymentReadyEvent(
	zeit: ZeitClient,
	event: Components.RequestBodies.DeploymentReadyEvent
) {
	const name = event.payload.name;
	const deployment = event.payload.deployment;
	const user = await getEventUser(zeit, event.userId);
	const team = zeit.teamId ? await zeit.getTeam() : null;
	const avatar = getUserAvatar(user, deployment);
	const username = getUserDisplayName(user, deployment);
	const projectUrl = getProjectURL(name, user, team);
	const deployContext = getDeploymentContext(deployment);
	const deploymentDashboardURL = getDeploymentDasboardURL(deployment);

	return {
		attachments: [
			{
				title: deployment.url,
				title_link: deploymentDashboardURL,
				author_name: `${username}${
					team ? ` from ${team.name} team` : ``
				}`,
				author_icon: avatar,
				text: `:white_check_mark: The project <${projectUrl}|${name}> deployed to <https://${deployment.url}|${deployment.url}> is *READY*.`,
				fallback: `The project ${projectUrl} deployed to ${deployment.url} is READY`,
				footer: deployContext,
				ts: (event.createdAt || Date.now()) / 1000,
				color: 'good'
			}
		]
	};
}

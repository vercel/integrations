import { Components } from '@zeit/api-types';
import { CurrentUser, TeamMember, Team } from '../zeit-client';
import getUserDisplayName from './get-user-display-name';

export default function getDeploymentDasboardURL(
	deployment?: Components.Schemas.Deployment,
	user?: CurrentUser | TeamMember,
	team?: Team | null
) {
	if (!deployment) {
		return null;
	}

	const { name, url } = deployment;
	const deploymentHostname = url.split('.')[0];
	const idx = deploymentHostname.indexOf(name) + name.length;
	const deploymentHash = deploymentHostname.substring(idx + 1);

	const sanitizedName = name.replace(/[^a-zA-Z0-9\-]+/g, '') // remove non-alphanumeric, non-dashes

	return team
		? `https://vercel.com/${team.slug}/${sanitizedName}/${deploymentHash}`
		: `https://vercel.com/${getUserDisplayName(user)}/${sanitizedName}/${deploymentHash}`;
}

import { Components } from '@zeit/api-types';
import { TeamMember, CurrentUser } from '../zeit-client';
import path from './path';

export default function getUserDisplayName(
	user?: CurrentUser | TeamMember,
	deployment?: Components.Schemas.Deployment
) {
	if (deployment && path(deployment, 'meta.githubDeployment')) {

		// Authors don't always have a githubCommitAuthorLogin if they're using an old git configuration
		return deployment.meta.githubCommitAuthorLogin || deployment.meta.githubCommitAuthorName;
	}

	return user ? user.username : null;
}

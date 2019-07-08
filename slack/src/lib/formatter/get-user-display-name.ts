import { Components } from '@zeit/api-types';
import { TeamMember, CurrentUser } from '../zeit-client';
import path from './path';

export default function getUserDisplayName(
	user?: CurrentUser | TeamMember,
	deployment?: Components.Schemas.Deployment
) {
	if (!deployment) {
		return user ? user.username : null;
	}

	if (path(deployment, 'meta.githubDeployment')) {
		return deployment.meta.githubCommitAuthorLogin;
	}

	return null;
}

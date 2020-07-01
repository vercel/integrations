import { Components } from '@zeit/api-types';
import { TeamMember, CurrentUser } from '../zeit-client';
import path from './path';

export default function getUserDisplayName(
	user?: CurrentUser | TeamMember,
	deployment?: Components.Schemas.Deployment
) {
	if (deployment && path(deployment, 'meta.githubDeployment')) {
		return deployment.meta.githubCommitAuthorLogin;
	}

	return user ? user.username : null;
}

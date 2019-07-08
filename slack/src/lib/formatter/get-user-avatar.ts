import { Components } from '@zeit/api-types';
import { TeamMember, CurrentUser } from '../zeit-client';
import path from './path';

export default function getUserAvatar(
	user?: CurrentUser | TeamMember,
	deployment?: Components.Schemas.Deployment
) {
	if (deployment && path(deployment, 'meta.gitlabDeployment')) {
		return deployment.meta.gitlabCommitAuthorAvatar;
	}

	if (deployment && path(deployment, 'meta.githubDeployment')) {
		return `https://avatars.githubusercontent.com/${deployment.meta.githubCommitAuthorLogin}?size=50`;
	}

	if (user && user.username) {
		return `https://zeit.co/api/www/avatar/?u=${user.username}&s=50`;
	}

	return null;
}

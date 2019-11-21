import { CurrentUser, TeamMember, Team } from '../zeit-client';
import getUserDisplayName from './get-user-display-name';

export default function getProjectURL(
	name: string,
	user?: CurrentUser | TeamMember,
	team?: Team | null
) {
	return team
		? `https://zeit.co/${team.slug}/${encodeURIComponent(name)}`
		: `https://zeit.co/${getUserDisplayName(user)}/${name}`;
}

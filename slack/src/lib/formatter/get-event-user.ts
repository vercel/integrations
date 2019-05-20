import { ZeitClient } from '../zeit-client';

export default async function getEventUser(zeit: ZeitClient, userId: string) {
	if (zeit.teamId) {
		const teamMembers = await zeit.getTeamMembers();
		return teamMembers.length > 0
			? teamMembers.find(member => member.uid === userId)
			: zeit.getCurrentUser();
	}

	return zeit.getCurrentUser();
}

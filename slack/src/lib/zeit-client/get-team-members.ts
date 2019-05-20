import buildFetcher, { Params } from './fetcher';
import { TeamMember } from './types';

export default function buildGetTeamMembers(params: Params) {
	const fetcher = buildFetcher(params);

	/**
	 * Allows to get the list of members of a given team
	 */
	return async function getTeamMembers(): Promise<TeamMember[]> {
		return params.teamId
			? fetcher<TeamMember[]>(`/v1/teams/${params.teamId}/members`)
			: [];
	};
}

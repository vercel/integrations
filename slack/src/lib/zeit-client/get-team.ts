import buildFetcher, { Params } from './fetcher';
import { Team } from './types';

export default function buildGetTeam(params: Params) {
	const fetcher = buildFetcher(params);

	/**
	 * Allows to get a team by id
	 */
	return async function getTeam(teamId?: string): Promise<Team> {
		return fetcher<Team>(`/v1/teams/${teamId || params.teamId}`);
	};
}

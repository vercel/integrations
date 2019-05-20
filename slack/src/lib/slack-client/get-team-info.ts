import nodeFetch from 'node-fetch';
import { stringify } from 'querystring';
import { TeamInfo } from './types';

export default function createGetTeamInfo({ token }: { token: string }) {
	return async function getTeamInfo(teamId: string) {
		const query = stringify({ token, team: teamId });
		const res = await nodeFetch(`https://slack.com/api/team.info?${query}`, {
			headers: { 'Content-Type': `application/x-www-form-urlencoded` },
			method: 'GET',
		});

		const body: { team: TeamInfo } = await res.json();
		if (!body.team) {
			return null;
		}

		return body.team;
	}
}

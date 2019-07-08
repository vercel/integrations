import buildGetTeamInfo from './get-team-info';

export default function getSlackClient({ token }: { token: string }) {
	return {
		getTeamInfo: buildGetTeamInfo({ token })
	};
}

export type ZeitClient = ReturnType<typeof getSlackClient>;
export * from './types';

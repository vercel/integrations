import buildCreateWebhook from './create-webhook';
import buildDeleteWebhook from './delete-webhook';
import buildGetCurrentUser from './get-current-user';
import buildGetTeam from './get-team';
import buildGetTeamMembers from './get-team-members';
import getAccessToken from './get-access-token';
import { Params } from './fetcher';

export default function getZeitClient(params: Params) {
	return {
		createWebhook: buildCreateWebhook(params),
		deleteWebhook: buildDeleteWebhook(params),
		getAccessToken,
		getCurrentUser: buildGetCurrentUser(params),
		getTeam: buildGetTeam(params),
		getTeamMembers: buildGetTeamMembers(params),
		teamId: params.teamId
	};
}

export type ZeitClient = ReturnType<typeof getZeitClient>;
export * from './types';

import { stringify } from 'querystring';
import { SCOPE } from '../constants';

const { HOOK_URL } = process.env;

/**
 * Allows to get a formatted authorization URL that later redirects to Slack.
 * It includes in the query string the requested scope, the ownerId and
 * the redirection URL for when the process is done.
 */
export default function getAuthorizeUri({
	scope = `${SCOPE.INCOMING_WEBHOOK} ${SCOPE.TEAM_READ}`,
	configurationId,
	ownerId,
	next
}: {
	scope?: string;
	configurationId: string;
	ownerId: string;
	next: string;
}) {
	return `${HOOK_URL}/authorize?${stringify({
		next,
		ownerId,
		scope,
		configurationId
	})}`;
}

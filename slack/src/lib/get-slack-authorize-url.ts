import { stringify } from 'querystring';

const { SLACK_CLIENT_ID } = process.env;

/**
 * Allows to get a formatted authorization URL to authenticate with OAuth
 * in Slack so we can show the user the authorization screen that later
 * redirects to the callback URL.
 */
export default function getSlackAuthorizeUrl(scope: string, state: string) {
	return `https://slack.com/oauth/authorize?${stringify({
		client_id: SLACK_CLIENT_ID,
		state,
		scope
	})}`;
}

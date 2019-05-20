import fetch from 'node-fetch';
import { stringify } from 'querystring';

interface SlackTokenInfo {
	access_token: string;
	scope: string;
	team_id: string;
	team_name: string;
	user_id: string;
	incoming_webhook?: {
		channel: string;
		channel_id: string;
		configuration_url: string;
		url: string;
	};
}

/**
 * Allows to exchange a Slack authorization code for an actual token. It is
 * assumed that the token has the scope of incoming webhook as that's the
 * only feature we include for now.
 */
export default async function getAccessToken(code: string) {
	const response = await fetch('https://slack.com/api/oauth.access', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			Accept: 'application/json'
		},
		body: stringify({
			client_id: process.env.SLACK_CLIENT_ID,
			client_secret: process.env.SLACK_CLIENT_SECRET,
			code
		})
	});

	if (response.status !== 200) {
		throw new Error(
			`Invalid status code on Azure token fetching: ${
				response.status
			} error: ${await response.text()}`
		);
	}

	const tokenInfo: SlackTokenInfo = await response.json();
	return tokenInfo;
}

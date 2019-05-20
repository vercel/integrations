import cookie from 'cookie';
import { IncomingMessage, ServerResponse } from 'http';
import { parse } from 'url';
import { send } from 'micro';
import { AUTH_COOKIE_NAME } from '../../constants';
import getIntegrationConfig from '../../lib/mongodb/get-integration-config';
import getSlackAccessToken from '../../lib/get-slack-access-token';
import saveIntegrationConfig from '../../lib/mongodb/save-integration-config';
import getWebhookHandler from '../../lib/get-webhook-handler';
import getZeitClient from '../../lib/zeit-client';

interface CallbackQuery {
	code?: string;
	state?: string;
}

/**
 * Handles the callback after a Slack authorization exchanging the Slack code
 * for an access token. Then it creates a hook with the retrieved ZEIT token
 * and bind them together in the app. Finally it redirects to the next url
 * which would be the integration UI.
 */
export default async function callback(
	req: IncomingMessage,
	res: ServerResponse
) {
	const { query } = parse(req.url!, true);
	const { code, state }: CallbackQuery = query;
	const cookies = cookie.parse(req.headers.cookie || '');
	const context = JSON.parse(cookies[AUTH_COOKIE_NAME] || '{}');

	if (!code || !state) {
		return send(res, 403, 'No code or state found');
	}

	if (state !== context.state) {
		return send(res, 403, 'Invalid state');
	}

	if (!context.ownerId) {
		return send(res, 403, 'No ownerId found to create ZEIT webhook');
	}

	// Exchange the code for an access token and ensure there is a webhook
	const tokenInfo = await getSlackAccessToken(code);
	const incomingWebhook = tokenInfo.incoming_webhook;
	if (!incomingWebhook) {
		throw new Error(
			'The integration only support `incoming_webhook` scope'
		);
	}

	// Get the integration configurationa and the zeit client to create a webhook
	const config = await getIntegrationConfig(context.ownerId);
	const zeit = getZeitClient(config);
	const zeitWebhook = await zeit.createWebhook({
		url: getWebhookHandler(incomingWebhook.url, config.ownerId),
		name: `Created from ZEIT Slack App to tunnel events`
	});

	// Store the configuration with the new webhook configured
	await saveIntegrationConfig({
		...config,
		webhooks: [
			...config.webhooks,
			{
				slackAuthorization: {
					accessToken: tokenInfo.access_token,
					scope: tokenInfo.scope,
					teamId: tokenInfo.team_id,
					teamName: tokenInfo.team_name,
					userId: tokenInfo.user_id,
					incomingWebhook
				},
				zeitWebhook
			}
		]
	});

	res.writeHead(302, {
		Location: `${decodeURIComponent(context.next)}`,
		'Set-Cookie': cookie.serialize(AUTH_COOKIE_NAME, '', { path: '/' })
	});

	res.end('Redirecting...');
	return null;
}

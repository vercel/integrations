import { parse } from 'url';
import { send } from 'micro';
import { IncomingMessage, ServerResponse } from 'http';
import getAccessToken from '../../lib/zeit-client/get-access-token';
import getAuthorizeUrl from '../../lib/get-authorize-url';
import maybeGetIntegrationConfig from '../../lib/mongodb/maybe-get-integration-config';
import saveIntegrationConfig from '../../lib/mongodb/save-integration-config';

/**
 * Handles the callback to exchange a ZEIT authorization code for a token.
 * With the token it brings the information related to the owner and the
 * installation. We will store it as the basic config for an integration
 * user.
 */
export default async function zeitCallback(
	req: IncomingMessage,
	res: ServerResponse
) {
	const { query }: { query: { code?: string; next?: string } } = parse(
		req.url!,
		true
	);
	const { code, next } = query;
	const tokenInfo = await getAccessToken(code!);
	const ownerId = tokenInfo.team_id || tokenInfo.user_id;

	if (!code || !next) {
		return send(res, 403, 'No code or next url found in query');
	}

	const maybeConfig = await maybeGetIntegrationConfig(ownerId);
	const savedConfig = await saveIntegrationConfig({
		zeitToken: tokenInfo.access_token,
		teamId: tokenInfo.team_id,
		userId: tokenInfo.user_id,
		webhooks: maybeConfig ? maybeConfig.webhooks : [],
		ownerId
	});

	const redirectLocation =
		savedConfig.webhooks.length === 0
			? getAuthorizeUrl({ next, ownerId })
			: decodeURIComponent(next);

	res.writeHead(302, { Location: redirectLocation });
	res.end('Redirecting...');
	return null;
}

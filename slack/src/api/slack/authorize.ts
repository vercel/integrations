import { IncomingMessage, ServerResponse } from 'http';
import { parse } from 'url';
import { send } from 'micro';
import cookie from 'cookie';
import { AUTH_COOKIE_NAME } from '../../constants';
import getSlackAuthorizeUrl from '../../lib/get-slack-authorize-url';

interface AuthorizeQuery {
	next?: string;
	ownerId?: string;
	scope?: string;
}

/**
 * Handles a Slack authorization request generating a state and writing
 * context information to a cookie to later redirect to the slack
 * authorization URL to complete the flow.
 */
export default function authorize(req: IncomingMessage, res: ServerResponse) {
	const { query }: { query: AuthorizeQuery } = parse(req.url!, true);

	if (!query.next) {
		return send(res, 403, 'A query parameter `next` is required');
	}

	if (!query.scope) {
		return send(res, 403, 'A query parameter `scope` is required');
	}

	if (!query.ownerId) {
		return send(res, 403, 'A query parameter `ownerId` is required');
	}

	/**
	 * In the context we will need to store the url to redirect after the
	 * process is done and the ownerId to be able to retrieve the token
	 * to create the webhook during the callback.
	 */
	const state = `state_${Math.random()}`;
	const redirectUrl = getSlackAuthorizeUrl(query.scope, state);
	const context = { next: query.next, ownerId: query.ownerId, state };

	res.writeHead(302, {
		Location: redirectUrl,
		'Set-Cookie': cookie.serialize(
			AUTH_COOKIE_NAME,
			JSON.stringify(context),
			{ path: '/' }
		)
	});

	res.end('Redirecting...');
}

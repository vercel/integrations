import fetch from 'node-fetch';
import { stringify } from 'querystring';
import { Token } from './types';

const {
	ZEIT_CLIENT_ID,
	ZEIT_CLIENT_SECRET,
	ZEIT_CLIENT_REDIRECT_URI
} = process.env;

/**
 * Allows to exchange an authorization code for a token payload that
 * includes the userId and the teamId along with the token and
 * token type for ZEIT.
 */
export default async function getAccessToken(code: string) {
	const res = await fetch(`https://api.vercel.com/v2/oauth/access_token`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
		},
		body: stringify({
			code,
			client_id: ZEIT_CLIENT_ID,
			client_secret: ZEIT_CLIENT_SECRET,
			redirect_uri: ZEIT_CLIENT_REDIRECT_URI
		})
	});

	const json = await res.json();

	if (json.error) {
		return null;
	}

	return json as Token;
}

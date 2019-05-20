const {parse: parseUrl} = require('url');
const cookie = require('cookie');

const {GITHUB_CLIENT_ID} = process.env;

module.exports = (req, res) => {
	const {query} = parseUrl(req.url, true);
	if (!query.next) {
		res.writeHead(403);
		res.end('Query param next is required');
		return;
	}

	const state = `state_${Math.random()}`;
	const redirectUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&state=${state}`;
	const context = {next: query.next, state};

	res.writeHead(302, {
		Location: redirectUrl,
		'Set-Cookie': cookie.serialize('my-addon-context', JSON.stringify(context), {path: '/'})
	});
	res.end('Redirecting...');
};

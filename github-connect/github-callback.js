const {parse: parseUrl} = require('url');
const cookie = require('cookie');

function send(res, statusCode, content) {
	res.writeHead(statusCode);
	res.end(content);
}

module.exports = (req, res) => {
	const { query } = parseUrl(req.url, true);
  const { code, state } = query;
  const cookies = cookie.parse(req.headers.cookie);
  const context = JSON.parse(cookies['my-addon-context'] || '{}');

  if (!code || !state) {
    return send(res, 403, 'No code or state found');
  }

  if (state !== context.state) {
    return send(res, 403, 'Invalid state');
  }

	// TODO: Validate next is a front URL before redirecting

  res.writeHead(302, {
    Location: `${context.next}?code=${code}`,
    'Set-Cookie': cookie.serialize('my-addon-context', '', { path: '/' })
  });

  res.end('Redirecting...');
};


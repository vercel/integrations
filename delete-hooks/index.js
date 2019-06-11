const micro = require('micro');
const { parse: parseUrl } = require('url');

module.exports = async function(req, res) {
  const { query } = parseUrl(req.url, true);
  if (req.method === 'DELETE') {
    const payload = await micro.json(req)
    console.log('Configuration has been deleted. You can do some cleanup tasks here.');
		console.log(`Payload: ${JSON.stringify(payload)}`);
    return micro.send(res, 200, {});
  }

  console.log('Configuration has been added.');
	// Here you can get an ZEIT token an use it to access our APIs.
  if (query.next) {
    res.writeHead(302, {
      Location: query.next
    });
    res.end('Redirecting...');
		return;
  }

	return micro.send(res, 200, {});
};

const micro = require('micro');
const { parse: parseUrl } = require('url');

module.exports = function(req, res) {
  const { query } = parseUrl(req.url, true);
  if (req.method === 'DELETE') {
    console.log('Configuration has been deleted. Do some cleanup tasks here.');
    return micro.send(res, 200, {});
  }
  console.log('Configuration has been added.');
  if (query.next) {
    res.writeHead(302, {
      Location: query.next
    });
    res.end('Redirecting...');
  }
};

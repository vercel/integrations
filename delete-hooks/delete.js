const micro = require('micro');

module.exports = async function(req, res) {
	const body = await micro.json(req);
	console.log(`> Received the Delete Hook with the following HTTP body`);
	console.log(JSON.stringify(body, null, 2));

	micro.send(res, 200);
}

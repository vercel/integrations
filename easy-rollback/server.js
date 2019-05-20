const micro = require('micro');
const uiHook = require('./');

const server = micro(uiHook);
const port = process.env.PORT || 5005;

console.log(`UiHook started on http://localhost:${port}`);
server.listen(port, (err) => {
	if (err) {
		throw err;
	}
});

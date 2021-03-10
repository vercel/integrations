const micro = require('micro');

let counter = 0;

async function uiHook(req, res) {
	// Add CORS support. So, UiHook can be called via client side.
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
	res.setHeader(
		'Access-Control-Allow-Headers',
		'Authorization, Accept, Content-Type'
	);

	if (req.method === 'OPTIONS') {
		return micro.send(res, 200);
	}

	// UiHook works only with HTTP POST.
	if (req.method !== 'POST') {
		return micro.send(res, 404, '404 - Not Found');
	}

	const payload = await micro.json(req);
	if (payload.action === 'reset') {
		counter = 0;
	} else {
		counter += 1;
	}

	return micro.send(res, 200, `
		<Page>
			<P>Counter: ${counter}</P>
			<Button>Count Me</Button>
			<Button action="reset">Reset</Button>
		</Page>
	`)
}

const server = micro(uiHook);
const port = process.env.PORT || 5005;

console.log(`UiHook started on http://localhost:${port}`);
server.listen(port, err => {
	if(err) {
		throw err;
	}
})

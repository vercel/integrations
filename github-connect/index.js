const {withUiHook, htm} = require('@zeit/integration-utils');
const qs = require('querystring');
const fetch = require('node-fetch');

const {GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, ROOT_URL} = process.env;

async function completeOAuthProcess({payload, zeitClient, metadata}) {
	const url = `https://github.com/login/oauth/access_token`;
	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Accept': 'application/json'
		},
		body: qs.stringify({
			client_id: GITHUB_CLIENT_ID,
			client_secret: GITHUB_CLIENT_SECRET,
			code: payload.query.code
		})
	});

	if (response.status !== 200) {
		throw new Error(
			`Invalid status code on GitHub token fetching: ${
				response.status
			} error: ${await response.text()}`
		);
	}

	const tokenInfo = await response.json();
	if (tokenInfo.error) {
		throw new Error(`GitHub OAuth issue: ${tokenInfo.error_description}`)
	}
	metadata.githubTokenInfo = tokenInfo;
	await zeitClient.setMetadata(metadata);
}

async function getGitHubUser(tokenInfo) {
	const url = `https://api.github.com/user`;
	const response = await fetch(url, {
		method: 'GET',
		headers: {
			'Authorization': `Bearer ${tokenInfo['access_token']}`
		}
	});

	return response.json();
}

module.exports = withUiHook(async ({payload, zeitClient}) => {
	const metadata = await zeitClient.getMetadata();
	if (payload.action === 'disconnect') {
		delete metadata.githubTokenInfo;
		await zeitClient.setMetadata(metadata);
	}

	if (!metadata.githubTokenInfo && payload.query.code) {
		await completeOAuthProcess({payload, zeitClient, metadata});
	}

	if (metadata.githubTokenInfo) {
		const githubUser = await getGitHubUser(metadata.githubTokenInfo);
		return htm`
			<Page>
				<P>Connected with GitHub user:
					<Link target="_blank" href=${'https://github.com/' + githubUser.login}>${githubUser.name || githubUser.login}</Link>
				</P>
				<Box><Img src=${githubUser['avatar_url']} width="64"/></Box>
				<Button small action="disconnect">Disconnect</Button>
			</Page>
		`;
	}

	const connectUrl = `${ROOT_URL}/connect-with-github?next=${encodeURIComponent(payload.installationUrl)}`
	return htm`
		<Page>
			<Link href=${connectUrl}>Connect With GitHub</Link>
		</Page>
	`
});

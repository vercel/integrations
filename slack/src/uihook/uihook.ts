import { withUiHook, htm } from '@zeit/integration-utils';
import getAuthorizeUrl from '../lib/get-authorize-url';
import getIntegrationConfig from '../lib/mongodb/get-integration-config';
import getZeitClient from '../lib/zeit-client';
import saveIntegrationConfig from '../lib/mongodb/save-integration-config';

export default withUiHook(async ({ payload }) => {
	const config = await getIntegrationConfig(
		payload.teamId || payload.user.id
	);
	const zeit = getZeitClient(config);
	const authorizeUrl = getAuthorizeUrl({
		next: encodeURIComponent(payload.installationUrl),
		ownerId: payload.teamId || payload.user.id
	});

	// When the user is deleting a webhook by id
	if (payload.action.includes('delete-')) {
		const id = payload.action.split('delete-')[1]!;
		await zeit.deleteWebhook(id);
		const deletedIdx = config.webhooks.findIndex(
			webhook => webhook.zeitWebhook.id === id
		);
		if (deletedIdx !== -1) {
			config.webhooks = [
				...config.webhooks.slice(0, deletedIdx),
				...config.webhooks.slice(deletedIdx + 1)
			];
			await saveIntegrationConfig(config);
		}
	}

	/**
	 * When we have the integration installed but there are no webhooks we
	 * should a button and a message to connect with Slack.
	 */
	if (config.webhooks.length === 0) {
		return htm`
			<Page>
				<Box display="flex" flexDirection="column" justifyContent="center" textAlign="center">
					<P>There are no webhooks currently configured. Please, connect to a Slack channel to start receiving ZEIT notifications.</P>
					<Box display="flex" marginTop="10px" justifyContent="center">
						<Link href=${authorizeUrl}>
							<Button>Connect to Slack</Button>
						</Link>
					</Box>
				</Box>
			</Page>
		`;
	}

	/**
	 * We must show all of the webhooks we have configured with the channel they
	 * are posting to and the events defined for the channel. Also a link to
	 * customize.
	 */
	const members = await zeit.getTeamMembers();

	return htm`
		<Page>
			${config.webhooks.map(({ zeitWebhook, slackAuthorization }) => {
				const creatorFromTeam = members.find(
					member => member.uid === zeitWebhook.userId
				);
				const creator = zeit.teamId ? creatorFromTeam : payload.user;
				const creatorUsername = creator
					? creator.username
					: `user deleted from team`;
				const avatar = creator
					? `https://zeit.co/api/www/avatar/?u=${creatorUsername}&s=150`
					: null;

				return htm`
					<Box display="flex" flexDirection="column" border="1px solid #eaeaea" borderRadius="5px" padding="15px" marginBottom="20px">
						<Box display="flex" alignItems="center">
							<B>Events:</B>
							<Box display="flex" marginLeft="5px">
								${
									zeitWebhook.events.length === 0
										? 'All events'
										: zeitWebhook.events.join(', ')
								}
							</Box>
						</Box>
						<Box display="flex" alignItems="center">
							<B>Channel:</B>
							<Box display="flex" marginLeft="5px">
								${slackAuthorization.incomingWebhook.channel}
							</Box>
						</Box>

						<Box display="flex" marginTop="10px" justifyContent="space-between" width="100%">
							<Box display="flex">
								<Button action="${encodeURIComponent(
									`delete-${zeitWebhook.id}`
								)}" small warning>
									Delete
								</Button>
							</Box>
							<Box display="flex" alignItems="center" justifyContent="flex-end" alignSelf="flex-end">
								<Box display="flex" marginRight="5px" fontSize="12px" color="#444">
									Installed by ${creatorUsername}
								</Box>
								${
									avatar
										? htm`
									<Box display="flex" borderRadius="50%" overflow="hidden" maxHeight="20px" maxWidth="20px">
										<Img src=${avatar} width="100%" />
									</Box>
								`
										: ''
								}
							</Box>
						</Box>
					</Box>
				`;
			})}
		</Page>
	`;

	// <Code value="${encodeURIComponent(JSON.stringify(config, undefined, '  '))}" />
});

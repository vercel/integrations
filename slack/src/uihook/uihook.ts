import { withUiHook, htm } from '@zeit/integration-utils';
import getAuthorizeUrl from '../lib/get-authorize-url';
import getIntegrationConfig from '../lib/mongodb/get-integration-config';
import getZeitClient from '../lib/zeit-client';
import getSlackClient from '../lib/slack-client';

export default withUiHook(async ({ payload }) => {
	const configurationId: string = payload.configurationId;
	const ownerId: string = payload.teamId || payload.user.id;
	const config = await getIntegrationConfig(ownerId);
	const zeit = getZeitClient(config);
	const authorizeUrl = getAuthorizeUrl({
		next: encodeURIComponent(payload.installationUrl),
		configurationId,
		ownerId
	});

	const configurationWebhooks = config.webhooks.filter(
		webhook => webhook.configurationId === payload.configurationId
	);

	/**
	 * When we have the integration installed but there are no webhooks we
	 * should a button and a message to connect with Slack.
	 */
	if (configurationWebhooks.length === 0) {
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
	const slackTeams = await Promise.all(
		configurationWebhooks.map(webhook => {
			const slack = getSlackClient({
				token: webhook.slackAuthorization.accessToken
			});
			return slack.getTeamInfo(webhook.slackAuthorization.teamId);
		})
	);

	return htm`
		<Page>
			${configurationWebhooks.map(({ zeitWebhook, slackAuthorization }, idx) => {
				const creatorFromTeam = members.find(
					member => member.uid === zeitWebhook.userId
				);
				const slackTeam = slackTeams[idx];
				const creator = zeit.teamId ? creatorFromTeam : payload.user;
				const creatorUsername = creator
					? creator.username
					: `user deleted from team`;
				const avatar = creator
					? `https://zeit.co/api/www/avatar/?u=${creatorUsername}&s=150`
					: null;

				return htm`
					<Box display="flex" flexDirection="column" backgroundColor="#fff" border="1px solid #eaeaea" borderRadius="5px" overflow="hidden">
						<Box display="flex" padding="15px" flexDirection="column">
							<Box display="flex" alignItems="center">
								${slackTeam &&
									slackTeam.icon.image_132 &&
									htm`
										<Box display="flex" borderRadius="50%" height="50px" width="50px" overflow="hidden">
											<Img src=${slackTeam.icon.image_132} width="100%" />
										</Box>
									`}
								<Box marginLeft="20px">
									<Box display="flex" fontSize="18px" fontWeight="bold">
										${
											zeitWebhook.events.length === 0
												? 'All events'
												: zeitWebhook.events.join(', ')
										}
									</Box>
									<Box display="flex" color="#666">
										${slackAuthorization.teamName}
									</Box>
								</Box>
							</Box>

							<Box display="inline-flex" marginTop="15px" fontSize="13px" marginRight="auto" width="auto" padding="0 4px" color="#666" border="1px solid #eaeaea" borderRadius="5px">
								${slackAuthorization.incomingWebhook.channel}
							</Box>
						</Box>

						<Box display="flex" backgroundColor="#fafbfc" justifyContent="space-between" width="100%" padding="10px" borderTop="1px solid #eaeaea">
							<Box display="flex">
								<Link href="${
									slackAuthorization.incomingWebhook
										.configuration_url
								}" target="_blank">View on Slack</Link>
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

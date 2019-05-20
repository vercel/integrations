import getConfigsCollection from './get-configs-collection';

/**
 * Gets an integration configuration object for the given ownerId
 * that includes both ZEIT and Slack tokens along with the configured
 * webhooks.
 */
export default async function getIntegrationConfig(ownerId: string) {
	const collection = await getConfigsCollection();
	const config = await collection.findOne({ ownerId });
	if (!config) {
		throw new Error(`No config found for owner ${ownerId}`);
	}

	return config;
}

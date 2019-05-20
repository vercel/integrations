import getIntegrationConfig from './get-integration-config';

/**
 * Gets an integration configuration object for the given ownerId
 * that includes both ZEIT and Slack tokens along with the configured
 * webhooks or null in case it does not exist
 */
export default async function maybeGetIntegrationConfig(ownerId: string) {
	try {
		return await getIntegrationConfig(ownerId);
	} catch (error) {
		return null;
	}
}

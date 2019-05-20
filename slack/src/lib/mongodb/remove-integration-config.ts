import getConfigsCollection from './get-configs-collection';
import { IntegrationConfig } from '../../types';

/**
 * Removes completely a given integration. This should happen when the user
 * uninstalls the app and there are no configurations left.
 */
export default async function removeIntegrationConfig(
	config: IntegrationConfig
) {
	const collection = await getConfigsCollection();
	await collection.remove({ ownerId: config.ownerId });
	return null;
}

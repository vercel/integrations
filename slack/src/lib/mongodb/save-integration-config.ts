import getConfigsCollection from './get-configs-collection';
import { IntegrationConfig } from '../../types';

/**
 * Saves a given integration configuration in the database. Later this
 * can be retrieved by ownerId to check for webhooks and to update.
 */
export default async function saveIntegrationConfig(config: IntegrationConfig) {
	const collection = await getConfigsCollection();
	await collection.updateOne(
		{ ownerId: config.ownerId },
		{ $set: config },
		{ upsert: true }
	);
	return config;
}

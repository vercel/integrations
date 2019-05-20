import mongodb from 'mongodb';
import { IntegrationConfig } from '../../types';

const { MONGO_URI } = process.env;

/**
 * Allows to retrieve a MongoDB collection object to query and upsert
 * new configuration objects.
 */
export default async function getConfigsCollection() {
	const client = await mongodb.connect(MONGO_URI!, { useNewUrlParser: true });
	const db = await client.db('slack-integration');
	return db.collection<IntegrationConfig>('integration-configs');
}

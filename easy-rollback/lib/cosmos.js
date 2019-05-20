module.exports = require('@zeit/cosmosdb').default({
	databaseName: 'now-prod',
	endpoint: 'https://zeit-sql-westus.documents.azure.com:443',
	masterKey: process.env.NOW_COSMOSDB_MASTER_KEY,
	preferredLocations: '["West US", "East US 2"]',
	metricName: 'integration-easy-rollback',
	disableLogging: true
});

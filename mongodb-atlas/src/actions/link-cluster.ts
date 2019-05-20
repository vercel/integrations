import { ViewInfo, AtlasCluster } from '../types';

export default async function linkCluster(
  viewInfo: ViewInfo,
  clusters: Array<AtlasCluster>
) {
  const { payload, metadata, zeitClient } = viewInfo;
  const clusterId = payload.action.replace('link/', '');
  const selectedCluster = clusters.find(c => c.id === clusterId);

  if (payload.projectId) {
    metadata.linkedClusters[payload.projectId] = clusterId;
    await zeitClient.setMetadata(metadata);

    // set the MONGO_URL
    const { username, password } = metadata.dbUser;
    if (selectedCluster && selectedCluster.srvAddress) {
      const mongoUrl = selectedCluster.srvAddress.replace(
        '//',
        `//${username}:${password}@`
      );
      const secretName = await zeitClient.ensureSecret(
        'mongodb-atlas-url',
        mongoUrl
      );
      await zeitClient.upsertEnv(payload.projectId, 'MONGO_URL', secretName);
    }
  }
}

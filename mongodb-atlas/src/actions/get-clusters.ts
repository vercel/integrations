import { ViewInfo, AtlasCluster } from '../types';

export default async function getClusters(viewInfo: ViewInfo) {
  const { atlasClient, metadata } = viewInfo;
  const apiPath = `/groups/${metadata.project.id}/clusters`;
  const clusters = await atlasClient!.fetchAndThrow(apiPath, { method: 'GET' });
  return clusters as Array<AtlasCluster>;
}

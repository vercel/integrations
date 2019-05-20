import { ZeitClient } from '@zeit/integration-utils';
import { Deployment, File } from '../types';
import { getQueryStr } from './utils';

export async function getDeployments(
  zeitClient: ZeitClient,
  options: { query?: { limit?: number; projectId?: string | null } } = {}
): Promise<Deployment[]> {
  const queryStr = getQueryStr(options.query || {});
  const apiUrl = `/v4/now/deployments${queryStr}`;
  const { deployments } = await zeitClient.fetchAndThrow(apiUrl, { method: 'GET' });

  return deployments;
}

export async function listDeploymentFiles(
  zeitClient: ZeitClient,
  { id, query }: { id: string; query?: { base?: string } }
): Promise<File[]> {
  const queryStr = getQueryStr(query || {});
  const apiUrl = `/v5/now/deployments/${id}/files${queryStr}`;
  const files = await zeitClient.fetchAndThrow(apiUrl, { method: 'GET' });

  return files;
}

/**
 * Get a file from Now's CDN
 */
export async function getFile(
  zeitClient: ZeitClient,
  { name, fileId }: { name: string; fileId: string }
): Promise<Buffer> {
  const apiUrl = `/v5/now/files/${fileId}/${name}`;
  const res = await zeitClient.fetch(apiUrl, { method: 'GET' });

  if (res.status !== 200) {
    throw new Error(
      `Failed ZEIT API call. path: ${apiUrl} status: ${res.status} error: ${await res.text()}`
    );
  }

  return res.buffer();
}

/**
 * Fetch all files from a deployment, this is a heavy operation because files are fetched one
 * by one due to API limitations.
 */
export async function getFiles(
  zeitClient: ZeitClient,
  { filesList }: { filesList: { path: string; name: string; uid: string }[] }
) {
  const files = filesList.map(async file => ({
    path: file.path,
    name: file.name,
    content: await getFile(zeitClient, { name: file.name, fileId: file.uid })
  }));

  return Promise.all(files);
}

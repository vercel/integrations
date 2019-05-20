import { listDeploymentFiles, getFiles } from '../lib/api';
import { filterRootFiles, getFilesDeep } from '../lib/files';
import { ViewOptions } from '../types';
import { createCodeSandbox } from '../codeSandbox';

/**
 * Create the sandbox based on the deployment source, private projects can be included too
 */
export default async function createSandbox({ options, metadata }: ViewOptions, id: string) {
  // 1. List the deployment files
  const { zeitClient } = options;
  const deploymentFiles = await listDeploymentFiles(zeitClient, { id });
  const filesList = getFilesDeep(filterRootFiles(deploymentFiles));

  // 2. Get the source code and create the sandbox
  const source = await getFiles(zeitClient, { filesList });
  const sandbox = await createCodeSandbox(metadata.token!, source);

  // 3. Cache the new sandbox
  metadata.sandboxes[id] = sandbox.id;
  await zeitClient.setMetadata(metadata);

  return sandbox;
}

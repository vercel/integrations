import { ViewOptions } from '../types';

export default async function logout({ options, metadata }: ViewOptions) {
  const { zeitClient } = options;

  delete metadata.user;
  delete metadata.token;

  await zeitClient.setMetadata(metadata);
}

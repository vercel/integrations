import { verifyAuthToken } from '../codeSandbox/api';
import { ViewOptions, UIError } from '../types';

/**
 * Use the token from the user's input to get the access token and user info from CodeSandbox
 */
export default async function verifyUser({ options, metadata }: ViewOptions) {
  const { token } = options.payload.clientState;

  if (!token) {
    throw new UIError('A token is required to continue');
  }

  const { zeitClient } = options;
  const userData = await verifyAuthToken(token);

  metadata.user = userData.user;
  metadata.token = userData.token;

  await zeitClient.setMetadata(metadata);

  return userData;
}

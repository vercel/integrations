import { ViewInfo } from '../types';
import AtlasClient from '../lib/atlas-client';
import dashboardView from './dashboard';

export default async function setupView(viewInfo: ViewInfo) {
  const { payload, metadata, zeitClient } = viewInfo;
  const atlasUrl = 'https://www.mongodb.com/cloud/atlas';
  const apiKeyUrl = 'https://cloud.mongodb.com/v2#/account/publicApi';
  const { username, apiKey } = payload.clientState;

  let error = null;
  if (payload.action === 'setup') {
    if (!username || !apiKey) {
      error = 'Both "Username" and "Public API Key" are required.';
    } else {
      const atlasClient = new AtlasClient({ username, apiKey });
      viewInfo.atlasClient = atlasClient;
      const authChecked = await atlasClient.authCheck();
      if (authChecked) {
        metadata.connectionInfo = { username, apiKey };
        await zeitClient.setMetadata(metadata);
        return dashboardView(viewInfo);
      }

      error = 'Either "Username" or "Public API Key" is incorrect.';
    }
  }

  return `
		<Box>
			<Fieldset>
				<FsContent>
					<FsTitle>Create Your MongoDB Atlas Account</FsTitle>
					<FsSubtitle>Visit <Link href="${atlasUrl}" target="_blank">MongoDB Atlas</Link> and create an account.</FsSubtitle>
				</FsContent>
				<FsFooter>
					<P>If you already have an account, you can use that account instead.</P>
				</FsFooter>
			</Fieldset>
			<Fieldset>
				<FsContent>
					<FsTitle>Your Username</FsTitle>
					<FsSubtitle>This is the email you use to login with MongoDB Atlas account.</FsSubtitle>
					<Input name="username" value="${username || ''}"/>
				</FsContent>
			</Fieldset>
			<Fieldset>
				<FsContent>
					<FsTitle>Your Public API Key</FsTitle>
					<FsSubtitle>Visit your <Link href="${apiKeyUrl}" target="_blank">account settings</Link> page and create a public API Key.</FsSubtitle>
					<Input name="apiKey" value="${apiKey || ''}"/>
				</FsContent>
			</Fieldset>
			${
        error
          ? `
				<Box color="red" marginBottom="20px">${error}</Box>
			`
          : ''
      }
			<Button action="setup">Setup</Button>
		</Box>
	`;
}

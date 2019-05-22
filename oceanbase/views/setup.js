const { htm } = require("@zeit/integration-utils");
const { getAccountInfo } = require("../lib/do-api");
const dashboardView = require("./dashboard");

module.exports = async function setupView(viewInfo) {
  const { payload, metadata, zeitClient } = viewInfo;
  const { email, accessToken } = payload.clientState;

  let error = null;

  if (payload.action === "setup") {
    if (!email || !accessToken) {
      error = 'Both "Email" and "Access Token" are required!';
    } else {
      const accountInfo = await getAccountInfo(accessToken);
      if (accountInfo) {
        if (email === accountInfo.email) {
          metadata.email = email;
          metadata.accessToken = accessToken;

          await zeitClient.setMetadata(metadata);
          viewInfo.metadata = metadata;

          return dashboardView(viewInfo);
        }
        error = 'Either "Email" or "Public API Key" is incorrect.';
      } else {
        error = 'Either "Email" or "Public API Key" is incorrect.';
      }
    }
  }

  const doUrl = "https://cloud.digitalocean.com/registrations/new";
  const accessTokenUrl = "https://cloud.digitalocean.com/account/api/tokens";

  return htm`
    <Box>
      <Fieldset>
        <FsContent>
          <FsTitle>Create A Digital Ocean Account</FsTitle>
          <FsSubtitle>Visit <Link href="${doUrl}" target="_blank">Digital Ocean</Link> to create a new account</FsSubtitle>
        </FsContent>
        <FsFooter>
          <P>If you already have an account, you can use that instead</P>
        </FsFooter>
      </Fieldset>
      <Fieldset>
        <FsContent>
          <FsTitle>Your Email</FsTitle>
          <FsSubtitle>This is the email you use to login to your Digital Ocean account.</FsSubtitle>
          <Input name="email" value="${email || ""}" />
        </FsContent>
      </Fieldset>
      <Fieldset>
        <FsContent>
          <FsTitle>Your Access Token</FsTitle>
          <FsSubtitle>Click <Link href="${accessTokenUrl}" target="_blank">here</Link> to create a new access token</FsSubtitle>
          <Input name="accessToken" value="${accessToken || ""}" />
        </FsContent>
      </Fieldset>
      <Button action="setup">Setup</Button>
    </Box>
  `;
};

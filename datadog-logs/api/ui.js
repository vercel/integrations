const { htm, withUiHook } = require("@zeit/integration-utils");
const { parse } = require("url");
const getLogDrains = require("../lib/get-log-drains");
const setup = require("../lib/setup");

module.exports = withUiHook(async ({ payload }) => {
  const { action, clientState, configurationId, teamId, token } = payload;

  console.log("getting log drains", configurationId);
  const drains = await getLogDrains({ teamId, token });
  let drain = drains.find(d => d.configurationId === configurationId);
  let errorMessage;

  if (!drain) {
    if (action === "setup") {
      ({ drain, errorMessage } = await setup({
        clientState,
        configurationId,
        teamId,
        token
      }));
    }
  }

  if (!drain) {
    return htm`
      <Page>
        <Fieldset>
          <FsContent>
            <H2>Create Your Datadog Account</H2>
            <P>Visit <Link href="https://www.datadoghq.com" target="_blank">Datadog</Link> and create an account.</P>
          </FsContent>
          <FsFooter>
            If you already have an account, you can use that account instead.
          </FsFooter>
        </Fieldset>
        <Fieldset>
          <FsContent>
            <H2>Activate Log Management</H2>
            <P>Go to the <Link href="https://app.datadoghq.com/logs/activation" target="_blank">Log Management</Link> and click <B>"Get Started"</B> -> <B>"Start Trial"</B> buttons to active log management for your account.</P>
          </FsContent>
        </Fieldset>
        <Fieldset>
          <FsContent>
            <H2>API Key</H2>
            <P>Go to the <Link href="https://app.datadoghq.com/account/settings#api" target="_blank">account settings</Link> and open the <B>"API Keys"</B> section to retrieve an API key</P>
            <Input name="key" value=${clientState.key ||
              ""} maxWidth="500px" width="100%" />
          </FsContent>
        </Fieldset>
        ${
          errorMessage ? htm`<Notice type="error">${errorMessage}</Notice>` : ""
        }
        <Button action="setup">Setup</Button>
      </Page>
    `;
  }

  const { pathname } = parse(drain.url);
  const key = pathname.split("/").pop();
  return htm`
    <Page>
      <P>You logs are being forwarded using the following API key on your account.</P>
        <Fieldset>
          <FsContent>
            <Box alignItems="center" display="flex" margin="20px 0" justifyContent="center">
              <H2>${"*".repeat(key.length - 4) + key.slice(-4)}</H2>
            </Box>
          </FsContent>
          <FsFooter>
            <Link href="https://app.datadoghq.com/logs" target="_blank">View logs on Datadog</Link>
          </FsFooter>
        </Fieldset>
    </Page>
  `;
});

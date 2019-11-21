const { htm, withUiHook } = require("@zeit/integration-utils");
const { parse } = require("url");
const createLogDrain = require("../lib/create-log-drain");
const getLogDrains = require("../lib/get-log-drains");
const getMetadata = require("../lib/get-metadata");

module.exports = withUiHook(async ({ payload }) => {
  const { action, clientState, configurationId, integrationId, teamId, token } = payload;

  console.log("getting log drains");
  const drains = await getLogDrains({ teamId, token });
  const drain = drains.find(d => d.configurationId === configurationId);
  if (!drain) {
    let errorMessage;
    if (action === 'setup') {
      console.log("getting metadata");
      const metadata = await getMetadata({ configurationId, token, teamId });

      console.log("creating a new log drain");
      try {
        drain = await createLogDrain(
          {
            token: metadata.token,
            teamId
          },
          {
            name: 'LogDNA drain',
            type: 'syslog',
            url: `syslog+tls://${clientState.url}`
          }
        );
      } catch (err) {
        console.error('Failed to create log drain', err);
        errorMessage = err.body && err.body.error ? err.body.error.message : err.message;
      }
    }

    return htm`
      <Page>
        <Fieldset>
          <FsContent>
            <H2>Create Your LogDNA Account</H2>
            <P>Visit <Link href="https://logdna.com" target="_blank">LogDNA</Link> and create an account.</P>
          </FsContent>
          <FsFooter>
            If you already have an account, you can use that account instead.
          </FsFooter>
        </Fieldset>
        <Fieldset>
          <FsContent>
            <H2>Setup a Syslog Port</H2>
            <P>Follow the <Link href="https://docs.logdna.com/docs/syslog">documentation</Link> to provision a syslog port for your organization.</P>
          </FsContent>
        </Fieldset>
        <Fieldset>
          <FsContent>
            <H2>Syslog URL</H2>
            <P>This is the syslog URL you just provisioned.</P>
            <Input name="url" value=${clientState.url || ''} maxWidth="500px" width="100%" />
          </FsContent>
        </Fieldset>
        ${errorMessage ? htm`<Notice type="error">${errorMessage}</Notice>` : ""}
        <Button action="setup">Setup</Button>
      </Page>
    `;
  }

  const { host } = parse(drain.url);
  return htm`
    <Page>
      <P>Your logs are forwarded to this sylog url available on your account.</P>
        <Fieldset>
          <FsContent>
            <Box alignItems="center" display="flex" margin="20px 0" justifyContent="center">
              <H2>${host}</H2>
            </Box>
          </FsContent>
        </Fieldset>
    </Page>
  `;
});

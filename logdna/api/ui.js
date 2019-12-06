const { htm, withUiHook } = require("@zeit/integration-utils");
const { parse } = require("url");
const getLogDrains = require("../lib/get-log-drains");
const getProject = require("../lib/get-project");
const setup = require("../lib/setup");

module.exports = withUiHook(async ({ payload }) => {
  const {
    action,
    clientState,
    configurationId,
    project,
    teamId,
    token
  } = payload;

  console.log("getting log drains");
  const drains = await getLogDrains({ teamId, token });
  let drain = drains.find(d => d.configurationId === configurationId);
  let errorMessage;

  if (!drain) {
    if (action === "setup") {
      ({ drain, errorMessage } = await setup({
        clientState,
        configurationId,
        project,
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
            <H2>Project Filtering</H2>
            <P>Subscribe logs of a project only (optional)</P>
            <ProjectSwitcher message="Select a project" />
          </FsContent>
        </Fieldset>
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
            <P>Follow the <Link href="https://docs.logdna.com/docs/syslog" target="_blank">documentation</Link> to provision a syslog port for your organization.</P>
          </FsContent>
        </Fieldset>
        <Fieldset>
          <FsContent>
            <H2>Syslog URL</H2>
            <P>This is the syslog URL you just provisioned.</P>
            <Input name="url" value=${clientState.url ||
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

  let projectForDrain = null;
  if (drain.projectId) {
    try {
      projectForDrain = await getProject(
        { token, teamId },
        { projectId: drain.projectId }
      );
    } catch (err) {
      if (!err.res || err.res.status !== 404) {
        throw err;
      }
    }
  }

  const { host } = parse(drain.url);
  return htm`
    <Page>
      ${
        drain.projectId && !projectForDrain
          ? htm`<Notice type="warn">The project to be filtered does not exist anymore (ID: ${drain.projectId})</Notice>`
          : ""
      }
      <P>Your logs are being forwarded to this sylog url available on your account.</P>
      <Fieldset>
        <FsContent>
          <Box alignItems="center" display="flex" margin="20px 0" justifyContent="center">
            <H2>${host}</H2>
          </Box>
        </FsContent>
        <FsFooter>
          <Box display="flex" flex="0 0 100%" justifyContent="space-between">
            <Link href="https://app.logdna.com" target="_blank">View logs on LogDNA</Link>
            ${
              projectForDrain
                ? htm`<P>Filtering for the project <B>${projectForDrain.name}</B></P>`
                : ""
            }
          </Box>
        </FsFooter>
      </Fieldset>
    </Page>
  `;
});

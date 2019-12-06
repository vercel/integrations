const { htm, withUiHook } = require("@zeit/integration-utils");
const { parse } = require("url");
const { DATADOG_HOSTS } = require("../lib/constants");
const detectRegion = require("../lib/detect-region");
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

  console.log("getting log drains", configurationId);
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
    const host = DATADOG_HOSTS[clientState.region] || DATADOG_HOSTS.us;
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
            <H2>Create Your Datadog Account</H2>
            <P>Visit <Link href="https://www.datadoghq.com" target="_blank">Datadog</Link> and create an account.</P>
          </FsContent>
          <FsFooter>
            If you already have an account, you can use that account instead.
          </FsFooter>
        </Fieldset>
        <Fieldset>
          <FsContent>
            <H2>Select Region</H2>
            <P>The region you chose when creating your account.</P>
            <Select name="region" value=${clientState.region ||
              "us"} action="region">
              <Option value="us" caption="US" />
              <Option value="eu" caption="EU" />
            </Select>
          </FsContent>
        </Fieldset>
        <Fieldset>
          <FsContent>
            <H2>Activate Log Management</H2>
            <P>Go to the <Link href=${`https://app.${host}/logs/activation`} target="_blank">Log Management</Link> and click <B>"Get Started"</B> -> <B>"Start Trial"</B> buttons to active log management for your account.</P>
          </FsContent>
        </Fieldset>
        <Fieldset>
          <FsContent>
            <H2>API Key</H2>
            <P>Go to the <Link href=${`https://app.${host}/account/settings#api`} target="_blank">account settings</Link> and open the <B>"API Keys"</B> section to retrieve an API key</P>
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

  const { hostname, pathname } = parse(drain.url);
  const key = pathname.split("/").pop();
  const region = detectRegion(hostname);
  return htm`
    <Page>
      ${
        drain.projectId && !projectForDrain
          ? htm`<Notice type="warn">The project to be filtered does not exist anymore (ID: ${drain.projectId})</Notice>`
          : ""
      }
      <P>You logs are being forwarded using the following API key on your account.</P>
      <Fieldset>
        <FsContent>
          <Box alignItems="center" display="flex" justifyContent="center" margin="20px 0">
            <H2>${"*".repeat(key.length - 4) + key.slice(-4)}</H2>
          </Box>
        </FsContent>
        <FsFooter>
          <Box display="flex" flex="0 0 100%" justifyContent="space-between">
            <P><Link href=${`https://app.${DATADOG_HOSTS[region]}/logs`} target="_blank">View logs on Datadog (${region.toUpperCase()})</Link></P>
            ${
              projectForDrain
                ? htm`<P>Filtering for the project <B>${projectForDrain.name}</B></P>`
                : ""
            }
          </Box>
        </FsContent>
      </Fieldset>
    </Page>
  `;
});

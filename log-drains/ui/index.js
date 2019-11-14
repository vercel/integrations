const { htm } = require("@zeit/integration-utils");
const ms = require("ms");
const { stringify } = require("querystring");
const getLogDrains = require("../lib/get-log-drains");
const getIntegration = require("../lib/get-integration");

module.exports = async (arg, { state }) => {
  const { payload } = arg;
  const { integrationId, teamId, token } = payload;
  const { errorMessage } = state;
  const drains = await getLogDrains({ teamId, token });
  drains.sort((a, b) => b.createdAt - a.createdAt);

  const otherIntergraionIds = new Set(
    drains.filter(d => d.clientId !== integrationId).map(d => d.clientId)
  );

  let otherIntergraionsMap;
  if (otherIntergraionIds.size) {
    const otherIntegrations = await Promise.all(
      [...otherIntergraionIds].map(id =>
        getIntegration({ teamId, token }, { id })
      )
    );
    otherIntergraionsMap = new Map(otherIntegrations.map(i => [i.id, i]));
  }

  return htm`
    <Page>
      <H1>Log Drains</H1>
      <Box display="flex" justifyContent="flex-end">
        <Button action="new-drain">Create Drain</Button>
      </Box>
      ${errorMessage ? htm`<Notice type="error">${errorMessage}</Notice>` : ""}
      ${
        drains.length
          ? drains.map(drain => {
              return htm`
            <Fieldset>
              <FsContent>
                <Box display="flex" justifyContent="space-between">
                  <Box>
                    <H2>${drain.name}</H2>
                    <P><B>Type:</B> ${drain.type}</P>
                    <P><B>URL:</B> ${drain.url}</P>
                  </Box>
                  <Box alignItems="flex-end" display="flex" flexDirection="column" justifyContent="space-between">
                    <P><Box color="#666">${ms(
                      Date.now() - drain.createdAt
                    )}</Box></P>
                    ${
                      drain.clientId === integrationId
                        ? htm`<Button action=${`delete-drain?${stringify({
                            id: drain.id
                          })}`} small type="error">DELETE</Button>`
                        : htm`
                          <P>
                            Created by <Link href=${`https://zeit.co/dashboard/integrations/${encodeURIComponent(
                              drain.configurationId
                            )}`}>${
                            otherIntergraionsMap.get(drain.clientId).name
                          }</Link>
                          </P>
                        `
                    }
                  </Box>
                </Box>
              </FsContent>
            </Fieldset>
          `;
            })
          : htm`
          <Box alignItems="center" display="flex" height="300px" justifyContent="center">
            <P>No drain found: <Link action="list-drains">Create a new log drain</Link></P>
          </Box>
        `
      }
      <AutoRefresh timeout="60000" />
    </Page>
  `;
};

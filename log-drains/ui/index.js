const { htm } = require("@zeit/integration-utils");
const ms = require("ms");
const { stringify } = require("querystring");
const getLogDrains = require("../lib/get-log-drains");

module.exports = async (arg, { state }) => {
  const { payload } = arg;
  const { teamId, token } = payload;
  const { errorMessage } = state;
  const drains = await getLogDrains({ teamId, token });
  drains.sort((a, b) => b.createdAt - a.createdAt);

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
                    <Button action=${`delete-drain?${stringify({
                      id: drain.id
                    })}`} small type="error">DELETE</Button>
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

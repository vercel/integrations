const { htm } = require("@zeit/integration-utils");

module.exports = async (arg, { state }) => {
  const { payload } = arg;
  const { clientState } = payload;
  const { name = "", type = "json", url = "" } = clientState;
  const { errorMessage } = state;

  return htm`
    <Page>
      <P><Link action="GET /drains">Back to list</Link></P>
      <Box marginBottom="50px">
        <Input label="Name" name="name" value=${name} maxWidth="500px" width="100%" />
        <Select label="Type" name="type" value=${type} >
          <Option value="json" caption="json" />
          <Option value="ndjson" caption="ndjson" />
          <Option value="syslog" caption="syslog" />
        </Select>
        <Input label="URL" name="url" value=${url} maxWidth="500px" width="100%" />
      </Box>
      ${errorMessage ? htm`<Notice type="error">${errorMessage}</Notice>` : ""}
      <Box display="flex" justifyContent="flex-end">
        <Button action="POST /drains">Create</Button>
      </Box>
    </Page>
  `;
};

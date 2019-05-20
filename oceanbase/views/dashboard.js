const { htm } = require("@zeit/integration-utils");
const { listDatabaseClusters } = require("../lib/do-api");

module.exports = async function dashboardView(viewInfo) {
  const { payload } = viewInfo;
  const { accessToken } = payload.clientState;

  const clusters = await listDatabaseClusters(accessToken);

  function renderClusters(clusters) {
    if (clusters.length > 0) {
      return htm`
        <Box>
          ${clusters.map(
            c =>
              htm`
              <Box padding="15px" border="1px solid #EAEAEA" borderRadius="3px" backgroundColor="#FAFAFA" marginBottom="20px">
	        <Box>
          	  ${c.name}
                </Box>
	      </Box> 
            `
          )}
        </Box>
      `;
    } else {
      return htm`
        <Box>No clusters found :(</Box>
      `;
    }
  }

  return htm`
   <Box display="flex" justify-content="space-between">
     <Box>
       This is a set of database clusters available on your account.
     </Box>
     <Button small>+ New Cluster</Button>
   </Box> 
   <Box margin="20px 0">
     ${renderClusters(clusters)}
   </Box>
  `;
};

const { htm } = require("@zeit/integration-utils");
const {
  listDatabaseClusters,
  getClusterSpecs,
  getEngineName,
  deleteCluster
} = require("../lib/do-api");
module.exports = async function dashboardView(viewInfo) {
  const { metadata, payload } = viewInfo;
  const { action, clientState } = payload;
  const { dbId } = clientState;
  const { accessToken } = metadata;

  if (action === "delete-cluster") {
    await deleteCluster(dbId, accessToken);
  }

  const clusters = await listDatabaseClusters(accessToken);

  function renderClusters(clusters) {
    if (clusters.length > 0) {
      return htm`
        <Box>
          ${clusters.map(c => {
            const specs = getClusterSpecs(c.size);
            return htm`
              <Box padding="15px" border="1px solid #EAEAEA" borderRadius="3px" backgroundColor="#FFFFFF" marginBottom="20px">
	        <Box>
	          <Box display="flex" alignItems="center" justifyContent="space-between" color="#0069ff">
	            <Box display="flex" alignItems="center">
	            <Box width="10px" height="10px" background="#15cd72" borderRadius="100%" />
	            <Box backgroundImage="url(https://cloud-cdn-digitalocean-com.global.ssl.fastly.net/aurora/assets/images/sprites-017d5619d752c4fcf3e36991faa7d80f.png)" backgroundSize="1134px 1112.5px" backgroundPosition="-1053.5px -880.5px" width="34px" height="34px" /> 
	            <H1> 
          	      ${c.name}
                    </H1>
	            </Box>
	            <Box display="flex">
	            <Box marginRight="15px">
	            <Button small secondary action="link-cluster">Link</Button>
	            </Box>
	            <Box display="none">
	              <Input name="dbId" value="${c.id}" type="hidden" />
	            </Box>
	            <Button small action="delete-cluster" warning>Delete</Button>
	            </Box>
	         </Box>
	         <P>${specs.ram} / ${
              specs.storage
            } Disk / ${c.region.toUpperCase()} - ${getEngineName(c.engine)} ${
              c.version
            }</P>
                </Box>
	      </Box> 
            `;
          })}
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
     <Button small action="new-cluster">+ New Cluster</Button>
   </Box> 
   <Box margin="20px 0">
     ${renderClusters(clusters)}
   </Box>
  `;
};

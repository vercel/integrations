const { htm } = require("@zeit/integration-utils");
const { createDatabase, listRegions, listDbSizes } = require("../lib/do-api");
const dashboardView = require("./dashboard");

module.exports = async function newClusterView(viewInfo) {
  const { payload, metadata } = viewInfo;
  const {
    name,
    engine,
    version,
    region,
    size,
    num_nodes
  } = payload.clientState;
  const { accessToken } = metadata;
  const { action } = payload;

  let error = null;

  if (action === "create-cluster") {
    if (name && engine && version && region && size && num_nodes) {
      try {
        const db = await createDatabase(
          { name, engine, version, region, size, num_nodes },
          accessToken
        );
        return dashboardView(viewInfo);
      } catch (e) {
        error = e.message;
      }
    } else {
      error =
        '"Name", "Engine", "Version", "Region", "Size", and "Number of Nodes" are all required fields.';
    }
  }

  let regions = [];

  regions = await listRegions(accessToken);
  dbSizes = listDbSizes();

  console.log("CREATE CLUSTER:", { payload, metadata });

  const databaseDocs = "https://www.digitalocean.com/docs/databases/";
  return htm`
    <Box>
      ${error &&
        htm`
        <Fieldset>
          <FsContent>
            <FsTitle>Error</FsTitle>
            <FsSubtitle>${error}</FsSubtitle>
          </FsContent>
        </Fieldset>
      `}
      <Fieldset>
        <FsContent>
          <FsTitle>Create A New Database Cluster</FsTitle>
          <FsSubtitle>Visit the Digital Ocean <Link href="${databaseDocs}" target="_blank">docs</Link> to learn more about managed databases</FsSubtitle>
        </FsContent>
      </Fieldset>
      <Fieldset>
        <FsContent>
          <FsTitle>Cluster Name</FsTitle>
          <FsSubtitle>A unique, human-readable name for the database cluster.</FsSubtitle>
          <Input name="name" value="${name || "acme"}" />
        </FsContent>
      </Fieldset>
      <Fieldset>
        <FsContent>
          <FsTitle>Database Engine</FsTitle>
          <FsSubtitle>Currently Digital Ocean only supports the PostgreSQL database engine, but will be adding support for both MySQL and Redis in the near future.</FsSubtitle>
          <Select name="engine" value="pg">
            <Option value="pg" caption="PostgreSQL" />
          </Select>
        </FsContent>
      </Fieldset>
      <Fieldset>
        <FsContent>
          <FsTitle>Database Engine Version</FsTitle>
          <FsSubtitle>The version of the database engine in use for the cluster.</FsSubtitle>
          <Select name="version" value="${version || 11}">
            <Option value="11" caption="11" />
            <Option value="10" caption="10" />
          </Select>
        </FsContent>
      </Fieldset>
      <Fieldset>
        <FsContent>
          <FsTitle>Cluster Region</FsTitle>
          <FsSubtitle>The region where the database cluster will be created.</FsSubtitle>
          <Select name="region" value="${region || "nyc1"}">
            ${regions.map(
              r =>
                htm`
                <Option value="${r.slug}" caption="${r.name} (${r.slug})"/>
              `
            )}
          </Select>
        </FsContent>
      </Fieldset>
      <Fieldset>
        <FsContent>
          <FsTitle>Database Storage Size</FsTitle>
          <FsSubtitle>The size of the nodes in the database cluster </FsSubtitle>
          <Select name="size" value="${size || "db-s-1vcpu-1gb"}">
            ${dbSizes.map(
              s =>
                htm`
                <Option value="${s.slug}" caption="${s.storage}"/>
              `
            )}
          </Select>
        </FsContent>
      </Fieldset>
      <Fieldset>
        <FsContent>
          <FsTitle>Number of Database Nodes</FsTitle>
          <FsSubtitle>The number of nodes in the database cluster. Valid values are are 1-3. In addition to the primary node, up to two standby nodes may be added for highly available configurations. The value is inclusive of the primary node. For example, setting the value to 2 will provision a database cluster with a primary node and one standby node.</FsSubtitle>
          <Select name="num_nodes" value="${num_nodes || 1}">
            <Option value="1" caption="1" />
            <Option value="2" caption="2" />
            <Option value="3" caption="3" />
          </Select>
        </FsContent>
      </Fieldset>
    <Button action="create-cluster">Create Cluster</Button>
    </Box>
  `;
};

import { ViewInfo, AtlasCluster } from '../types';
import prepareAtlas from '../actions/prepare-atlas';
import getClusters from '../actions/get-clusters';
import linkCluster from '../actions/link-cluster';
import { UiHookPayload } from '@zeit/integration-utils';

function getLinks(cluster: AtlasCluster) {
  const configurationsLink = `https://cloud.mongodb.com/v2/${
    cluster.groupId
  }#clusters/detail/${cluster.name}`;
  return `
		<Link href="${configurationsLink}" target="_blank">View on Atlas</Link>
	`;
}

function getRegion(cluster: AtlasCluster) {
  const regionOrginal = cluster.providerSettings.regionName;
  return regionOrginal.replace(/_/g, '-').toLowerCase();
}

function getState(cluster: AtlasCluster) {
  const colorMap: { [key: string]: string } = {
    IDLE: '#16a016',
    CREATING: '#737373',
    DELETED: '#eb5757'
  };
  const color = colorMap[cluster.stateName] || '#ef8600';

  let name = cluster.stateName;
  if (name === 'IDLE') {
    name = 'READY';
  }

  return `
		<Box
			marginLeft="5px"
			fontSize="10px"
			lineHeight="12px"
			border="0"
			borderRadius="2px"
			padding="2px 5px"
			color="#FFF"
			backgroundColor="${color}"
		>
			${name}
		</Box>
	`;
}

function renderClusters(
  clusters: Array<AtlasCluster>,
  payload: UiHookPayload,
  metadata: any
) {
  if (clusters.length === 0) {
    return `
			<Box>No clusters found!</Box>
		`;
  }

  let linkedCluster: AtlasCluster | null = null;
  const otherClusters = [];
  const linkedClusterId = metadata.linkedClusters[payload.projectId || ''];
  for (const cluster of clusters) {
    if (cluster.id === linkedClusterId) {
      linkedCluster = cluster;
    } else {
      otherClusters.push(cluster);
    }
  }

  let output = '';

  if (linkedCluster) {
    output += `
			<Box padding="15px" border="1px solid #EAEAEA" borderRadius="3px" backgroundColor="#FAFAFA" marginBottom="20px">
				<Box fontWeight="500" fontSize="16px" color="#13aa52">${
          linkedCluster.name
        }</Box>
				<Box fontSize="13px">Deployed in ${getRegion(linkedCluster)} (${
      linkedCluster.diskSizeGB
    } GB)</Box>
				<Box display="flex" justifyContent="space-between">
					<Button small action="unlink">Unlink</Button>
					<Box marginLeft="auto">${getLinks(linkedCluster)}</Box>
				</Box>
			</Box>
		`;
  }

  output += `
		${otherClusters
      .map(
        (c, index) => `
			<Box padding="15px" border="1px solid #EAEAEA" borderRadius="3px" backgroundColor="#FAFAFA" marginBottom="${
        index !== otherClusters.length - 1 ? '20px' : ''
      }">
				<Box display="flex" alignItems="center" justifyContent="space-between">
					<Box fontWeight="500" fontSize="16px" color="#13aa52">${c.name}</Box>
					${getState(c)}
				</Box>
				<Box fontSize="13px">Deployed in ${getRegion(c)} (${c.diskSizeGB} GB)</Box>
				<Box display="flex" justifyContent="space-between">
					${
            !linkedCluster && c.stateName === 'IDLE'
              ? `<Button small action="link/${c.id}">Link To Project</Button>`
              : ''
          }
					<Box marginLeft="auto">${getLinks(c)}</Box>
				</Box>
			</Box>
		`
      )
      .join('\n')}
	`;

  return output;
}

export default async function dashboardView(viewInfo: ViewInfo) {
  try {
    await prepareAtlas(viewInfo);
  } catch(err) {
    return `
      <Box>
        <Notice type="error">${err.message}</Notice>
        <Box>
          Make sure your MongoDB Atlas API Key has the "Organization Owner" permission.
        </Box>
        <Box>
          If not, remove this configuration and add a new one with your new MongoDB Atlas API key.
        </Box>
      </Box>
    `
  }

  const clusters = await getClusters(viewInfo);
  const { metadata, payload, zeitClient } = viewInfo;
  metadata.linkedClusters = metadata.linkedClusters || {};
  let error = null;

  if (/^link/.test(payload.action)) {
    if (!payload.projectId) {
      error = 'To Link, select a project view. <ProjectSwitcher />';
    } else {
      await linkCluster(viewInfo, clusters);
    }
  }

  if (payload.action === 'unlink' && payload.projectId) {
    delete metadata.linkedClusters[payload.projectId];
    await zeitClient.setMetadata(metadata);
  }

  const needToRefresh = Boolean(clusters.find(c => c.stateName !== 'IDLE'));
  return `
		<Box marginBottom="10px" textAlign="right">
			<ProjectSwitcher />
		</Box>
		${error ? `<Notice type="error">${error}</Notice>` : ''}
		<Box display="flex" justify-content="space-between">
			<Box>
				This is a set of database clusters available on your account.
			</Box>
			<Button small action="new-cluster">+ New Cluster</Button>
		</Box>
		<Box margin="20px 0">
			${renderClusters(clusters, payload, metadata)}
		</Box>
		<Box borderTop="1px solid #EAEAEA" paddingTop="10px" fontSize="12px" color="#44">
				Once linked, we automatically set the MONGO_URL env variable. <Link href="https://zeit.co/api" target="_blank">Read More</Link>.
		</Box>
		${needToRefresh ? '<AutoRefresh timeout="10000"/>' : ''}
	`;
}

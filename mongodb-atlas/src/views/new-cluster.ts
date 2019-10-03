import { ViewInfo } from '../types';

export default async function newClusterView(viewInfo: ViewInfo) {
  const { project } = viewInfo.metadata;
  const loginUrl = 'https://cloud.mongodb.com/user#/atlas/login';
  const buildClusterUrl = `https://cloud.mongodb.com/v2/${
    project.id
  }#clusters/edit`;

  const stepStyles =
    'padding="15px" margin="20px 0" backgroundColor="#fafafa" border="1px solid #eaeaea" borderRadius="3px"';

  return `
		<Box>
			<H1>Build a New Cluster</H1>
			<P>These steps help you to create a new MongoDB Atlas cluster which works best with ZEIT deployments.</P>
			<Box margin="10px 0">
				<Box ${stepStyles}>
					Login to <Link href="${loginUrl}" target="_blank">MongoDB Atlas</Link>.
				</Box>
				<Box ${stepStyles}>
					Build cluster by following <Link href="${buildClusterUrl}" target="_blank">this</Link> wizard.
				</Box>
				<Box ${stepStyles}>
					Select AWS as the Cloud provider and choose a region closer to your customers.
				</Box>
			</Box>
			<Button action="view">Complete</Button>
		</Box>
	`;
}

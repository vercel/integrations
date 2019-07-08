import { Components } from '@zeit/api-types';

export default function getDeploymentDasboardURL(
	deployment?: Components.Schemas.Deployment
) {
	if (!deployment) {
		return null;
	}

	const { name, url } = deployment;
	const deploymentHostname = url.split('.')[0];
	const idx = deploymentHostname.indexOf(name) + name.length;
	return deploymentHostname.substring(idx + 1);
}

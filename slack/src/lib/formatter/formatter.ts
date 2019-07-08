import getZeitClient, { Event } from '../zeit-client';
import formatDomainEvent from './events/domain';
import formatDeploymentEvent from './events/deployment';
import formatDomainDeleteEvent from './events/domain-delete';
import formatDeploymentErrorEvent from './events/deployment-error';
import formatDeploymentReadyEvent from './events/deployment-ready';

export default function buildFormatter({
	zeitToken,
	teamId
}: {
	zeitToken: string;
	teamId?: string | null;
}) {
	const zeit = getZeitClient({ zeitToken, teamId });
	return async function formatEvent(event: Event) {
		switch (event.type) {
			case 'deployment':
				return formatDeploymentEvent(zeit, event);
			case 'deployment-ready':
				return formatDeploymentReadyEvent(zeit, event);
			case 'deployment-error':
				return formatDeploymentErrorEvent(zeit, event);
			case 'domain':
				return formatDomainEvent(zeit, event);
			case 'domain-delete':
				return formatDomainDeleteEvent(zeit, event);
			default:
				return null;
		}
	};
}

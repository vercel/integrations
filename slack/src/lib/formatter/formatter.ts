import getZeitClient, { Event } from '../zeit-client';
import formatDeploymentEvent from './events/deployment';
import formatDomainEvent from './events/domain';
import formatDomainDeleteEvent from './events/domain-delete';

export default function buildFormatter({
	zeitToken,
	teamId
}: {
	zeitToken: string;
	teamId?: string | null;
}) {
	const zeit = getZeitClient({ zeitToken, teamId });
	return async function formatEvent(event: Event<any>) {
		switch (event.type) {
			case 'domain':
				return formatDomainEvent(zeit, event);
			case 'domain-delete':
				return formatDomainDeleteEvent(zeit, event);
			case 'deployment':
				return formatDeploymentEvent(zeit, event);
			default:
				return null;
		}
	};
}

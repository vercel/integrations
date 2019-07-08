import { Components } from '@zeit/api-types';
import { ZeitClient } from '../../zeit-client';
import getEventUser from '../get-event-user';

export default async function domain(
	zeit: ZeitClient,
	event: Components.RequestBodies.DomainEvent
) {
	const eventUser = await getEventUser(zeit, event.userId);
	const username = eventUser ? eventUser.username : event.userId;
	return {
		text: `The user *${username}* added the domain ${event.payload.name}`
	};
}

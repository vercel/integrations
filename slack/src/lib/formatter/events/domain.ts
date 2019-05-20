import { ZeitClient, Event } from '../../zeit-client';
import getEventUser from '../get-event-user';

interface DomainPayload {
	name: string;
}

export default async function domain(
	zeit: ZeitClient,
	event: Event<DomainPayload>
) {
	const eventUser = await getEventUser(zeit, event.userId);
	const username = eventUser ? eventUser.username : event.userId;
	return {
		text: `The user *${username}* added the domain ${event.payload.name}`
	};
}

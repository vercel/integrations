import { stringify } from 'querystring';

const { HOOK_URL } = process.env;

export default function getWebhookHandler(url: string, ownerId: string) {
	return `${HOOK_URL}/webhook-handler?${stringify({
		incoming_webhook: encodeURIComponent(url),
		owner_id: ownerId
	})}`;
}

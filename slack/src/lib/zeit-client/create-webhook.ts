import buildFetcher, { Params } from './fetcher';
import { Webhook } from './types';

export default function buildCreateWebhook(params: Params) {
	const fetcher = buildFetcher(params);

	/**
	 * Allows to create a webhook in ZEIT with a given URL, name
	 * and an array on events to be triggered.
	 */
	return async function createWebhook({
		url,
		name,
		events = []
	}: {
		url: string;
		name: string;
		events?: string[];
	}): Promise<Webhook> {
		return fetcher<Webhook>(`/v1/integrations/webhooks`, {
			data: { url, name, events },
			method: 'POST'
		});
	};
}

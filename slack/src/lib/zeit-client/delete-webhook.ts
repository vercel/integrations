import buildFetcher, { Params } from './fetcher';
import { Webhook } from './types';

export default function buildDeleteWebhook(params: Params) {
	const fetcher = buildFetcher(params);

	/**
	 * Allows to delete a webhook by id
	 */
	return async function deleteWebhook(id: string): Promise<Webhook> {
		return fetcher<Webhook>(`/v1/integrations/webhooks/${id}`, {
			method: 'DELETE',
			throwOnError: false
		});
	};
}

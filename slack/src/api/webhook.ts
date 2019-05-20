import { IncomingMessage, ServerResponse } from 'http';
import { parse } from 'url';
import { send, json } from 'micro';
import fetch from 'node-fetch';
import { Event } from '../lib/zeit-client';
import getFormatter from '../lib/formatter';
import getIntegrationConfig from '../lib/mongodb/get-integration-config';

interface WebhookParams {
	owner_id?: string;
	incoming_webhook?: string;
}

export default async function webhookHandler(
	req: IncomingMessage,
	res: ServerResponse
) {
	const { query }: { query: WebhookParams } = parse(req.url!, true);
	const event = await json(req);
	const incomingWebhook = decodeURIComponent(query.incoming_webhook!);
	const config = await getIntegrationConfig(query.owner_id!);
	const formatter = getFormatter(config);
	const body = await formatter(event as Event<any>);

	if (!body) {
		return send(res, 200);
	}

	console.log(`Sending a notification to ${incomingWebhook} with text`, body);
	await fetch(incomingWebhook, {
		method: 'POST',
		body: JSON.stringify(body)
	});

	return send(res, 200);
}

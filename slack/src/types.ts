import { Webhook } from './lib/zeit-client';

export interface Metadata {
	lastCode?: string;
}

export interface SlackAuthorization {
	accessToken: string;
	scope: string;
	teamId: string;
	teamName: string;
	userId: string;
	incomingWebhook: {
		channel: string;
		channel_id: string;
		configuration_url: string;
		url: string;
	};
}

export interface IntegrationConfig {
	ownerId: string;
	userId: string;
	teamId?: string | null;
	zeitToken: string;
	webhooks: {
		slackAuthorization: SlackAuthorization;
		zeitWebhook: Webhook;
	}[];
}

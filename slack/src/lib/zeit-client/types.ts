export interface Token {
	access_token: string;
	token_type: 'Bearer';
	installation_id: string;
	user_id: string;
	team_id?: string | null;
}

export interface Webhook {
	createdAt: number;
	events: string[];
	id: string;
	name: string;
	teamId?: string | null;
	url: string;
	userId: string;
}

export interface Event<T extends { [key: string]: any }> {
	type: string;
	userId: string;
	teamId?: string | null;
	createdAt?: number;
	payload: T;
}

export interface TeamMember {
	uid: string;
	role: 'MEMBER' | 'OWNER';
	email: string;
	username: string;
	confirmed: boolean;
}

export interface CurrentUser {
	uid: string;
	avatar: string | null;
	bio: string | null;
	date: string;
	email: string;
	name: string | null;
	username: string;
}

export interface Team {
	id: string;
	slug: string;
	name: string;
	creator_id: string;
	creatorId: string;
	created: string;
	avatar: string;
	description: string;
}

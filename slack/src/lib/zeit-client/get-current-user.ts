import buildFetcher, { Params } from './fetcher';
import { CurrentUser } from './types';

export default function buildGetCurrentUser(params: Params) {
	const fetcher = buildFetcher(params);
	return async function getCurrentUser() {
		const { user } = await fetcher<{ user: CurrentUser }>('/www/user');
		return user;
	};
}

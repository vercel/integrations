import nodeFetch, { RequestInit } from 'node-fetch';
import { stringify } from 'querystring';

export interface Params {
	zeitToken: string;
	teamId?: string | null;
}

interface Options extends RequestInit {
	data?: { [key: string]: string | number | string[] };
	query?: { [key: string]: string | number };
	throwOnError?: boolean;
}

export default function buildFetcher({ zeitToken, teamId }: Params) {
	return async function fetch<T>(
		path: string,
		options: Options = {}
	): Promise<T> {
		const { data, query = {}, throwOnError, ...fetchOpts } = options;
		const queryStr = teamId
			? stringify({ ...query, teamId })
			: stringify({ ...query });
		const url = `https://api.vercel.com${path}?${queryStr}`;
		const method = options.method || 'GET';

		console.log(`[${options.method || 'GET'}] ${url}`);
		const res = await nodeFetch(url, {
			body: data ? JSON.stringify(options.data) : undefined,
			...fetchOpts,
			method,
			headers: {
				...options.headers,
				Authorization: `Bearer ${zeitToken}`
			}
		});

		let json;

		try {
			json = await res.json();
		} catch (error) {
			json = null;
		}

		if (!res.ok) {
			console.log(res);
			console.log(json);
			if (options.throwOnError) {
				throw new Error('Request to ZEIT failed');
			} else {
				json = null;
			}
		}

		return json;
	};
}

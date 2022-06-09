import { fetch, FetchResultTypes } from '@sapphire/fetch';
import { URL, URLSearchParams } from 'node:url';
import { env } from '#root/config';
import { setTimeout } from 'node:timers';
import { Time } from '@sapphire/time-utilities';

export interface QueryResult {
	queryresult: {
		success: boolean;
		error: boolean;
		pods: { title: string; error: boolean; subpods: { name: string; plaintext: string; img: { src: string } }[] }[];
		didyoumeans?: { val: string };
		sources?: { url: string; text: string } | { url: string; text: string }[];
		infos?: { text: string } | { text: string }[];
	};
}

export interface AutocompleteResult {
	results: { input: string }[];
}

export class WolframService {
	private params = new URLSearchParams({
		appid: env.WOLFRAM_APP_ID,
		format: ['plaintext', 'image'],
		output: 'json',
		podstate: 'Step-by-step solution'
	});

	public async calculate(query: string) {
		this.params.set('input', query);

		const ac = new AbortController();
		setTimeout(() => ac.abort(), Time.Minute * 15);

		const url = new URL('https://api.wolframalpha.com/v2/query.jsp');
		url.search = this.params.toString();

		const res = await fetch<QueryResult>(url, { signal: ac.signal }, FetchResultTypes.JSON);
		return res.queryresult;
	}

	public async autocomplete(query: string) {
		const url = new URL('https://www.wolframalpha.com/n/v1/api/autocomplete');
		url.searchParams.append('i', query);

		const res = await fetch<AutocompleteResult>(url, FetchResultTypes.JSON);
		return res.results.map(({ input }) => input);
	}

	public static canRun() {
		return Boolean(env.WOLFRAM_APP_ID);
	}
}

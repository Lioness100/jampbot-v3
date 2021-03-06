import { fetch, FetchMethods, FetchMediaContentTypes } from '@sapphire/fetch';
import { retryable } from '#utils/common';

export interface Level {
	code: string;
	level_name: string;
	maker_id: string;
	tags: string;
	videos?: string;
}
interface MemberResponse {
	plays: (Level & { completed: 0 | 1 })[];
}

interface LevelResponse {
	levels: Level[];
}

export class MakerTeamsService {
	private readonly baseBody = { url_slug: 'teamjamp' };
	private readonly baseHeaders = { 'Content-Type': FetchMediaContentTypes.JSON };
	private readonly baseURL = new URL('https://makerteams.net/backend/json');

	public async getMemberPlays(name: string) {
		const body = JSON.stringify({ ...this.baseBody, name });
		const res = await retryable(() => fetch<MemberResponse>(this.baseURL, { body, method: FetchMethods.Post, headers: this.baseHeaders }));
		return res?.plays;
	}

	public async getLevels() {
		const body = JSON.stringify(this.baseBody);
		const res = await retryable(() => fetch<LevelResponse>(this.baseURL, { body, method: FetchMethods.Post, headers: this.baseHeaders }));
		return res?.levels;
	}

	public async getLevel(code: string) {
		const body = JSON.stringify({ ...this.baseBody, code });
		const res = await retryable(() => fetch<LevelResponse>(this.baseURL, { body, method: FetchMethods.Post, headers: this.baseHeaders }));
		return res?.levels[0];
	}
}

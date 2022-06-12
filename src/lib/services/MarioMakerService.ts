import { fetch, FetchResultTypes } from '@sapphire/fetch';
import { Time } from '@sapphire/time-utilities';
import { setTimeout } from 'node:timers';
import { Emoji } from '#utils/constants';

export interface MakerBadge {
	rank: number;
	type_name: string;
}

export interface MakerInfoResponse {
	error?: string;
	code: string;
	country: string;
	region_name: string;
	name: string;
	mii_image: string;
	last_active: number;
	courses_played: number;
	courses_cleared: number;
	courses_attempted: number;
	courses_deaths: number;
	likes: number;
	maker_points: number;
	versus_rank_name: number;
	versus_won: number;
	versus_plays: number;
	versus_kills: number;
	first_clears: number;
	world_records: number;
	uploaded_levels: number;
	last_uploaded_level?: number;
	super_world_id?: string;
	badges: MakerBadge[];
}

export interface LevelInfoResponse {
	error?: string;
	name: string;
	description: string;
	uploaded: number;
	course_id: string;
	game_style_name: string;
	theme_name: string;
	difficulty_name: string;
	tags_name: string[];
	world_record_pretty: string;
	upload_time_pretty: string;
	clears: number;
	attempts: number;
	clear_rate: number;
	plays: number;
	likes: number;
	boos: number;
	num_comments: number;
	uploader: MakerInfoResponse;
	first_completer: MakerInfoResponse;
	record_holder: MakerInfoResponse;
}

export class MarioMakerService {
	public readonly baseURL = new URL('https://tgrcode.com/mm2/');

	public getLevelInfo(code: string) {
		const ac = new AbortController();
		setTimeout(() => ac.abort(), Time.Minute * 15);

		const url = new URL(`level_info/${code}`, this.baseURL);
		return fetch<LevelInfoResponse>(url, { signal: ac.signal }, FetchResultTypes.JSON);
	}

	public getMakerInfo(code: string) {
		const ac = new AbortController();
		setTimeout(() => ac.abort(), Time.Minute * 15);

		const url = new URL(`user_info/${code}`, this.baseURL);
		return fetch<MakerInfoResponse>(url, { signal: ac.signal }, FetchResultTypes.JSON);
	}

	public getLevelThumbnail(code: string) {
		return new URL(`level_thumbnail/${code}`, this.baseURL).toString();
	}

	public getLevelImage(code: string) {
		return new URL(`level_entire_thumbnail/${code}`, this.baseURL).toString();
	}

	public static readonly badgeEmojis = [
		Emoji.GoldRibbon,
		Emoji.SilverRibbon,
		Emoji.BronzeRibbon,
		Emoji.GoldMedal,
		Emoji.SilverMedal,
		Emoji.BronzeMedal
	];

	public static formatNameShort(user: MakerInfoResponse) {
		const badges = user.badges.map((badge) => this.badgeEmojis[badge.rank]);
		return `${user.name} [${badges.join('')}]`;
	}

	public static formatCode(code: string) {
		return code.match(/.{3}/g)!.join('-');
	}

	public static resolveCode(code: string) {
		const codeSegmentRegex = String.raw`((?:[0-9]|[a-h]|[j-n]|[p-y]){3})(?:\-|\s)?`;
		const codeRegex = new RegExp(`^${codeSegmentRegex.repeat(3)}$`, 'i');

		return codeRegex.exec(code)?.slice(1).join('');
	}
}

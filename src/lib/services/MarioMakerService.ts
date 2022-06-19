/* eslint-disable unicorn/numeric-separators-style */
/* eslint-disable unicorn/number-literal-case */
import { fetch, FetchResultTypes } from '@sapphire/fetch';
import { Emoji } from '#utils/constants';
import { Buffer } from 'node:buffer';
import { createDecipheriv } from 'node:crypto';
import { retryable } from '#utils/common';

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

export const enum ObjectId {
	MasterSword = 10_20,
	FireFlower = 34,
	SuperBall = 10_34,
	SuperStar = 35,
	Checkpoint = 90,
	BigMushroomOrRaccoonOrPropellorOrCatOrCape = 44,
	YoshiOrBoot,
	Bowser = 62,
	KoopaCar = 72,
	FrogOrSMB2OrBalloonOrAcornOrBoomerang = 81,
	RedCoin = 92,
	BowserJr = 98,
	Hammer = 116,
	Lemmy = 120,
	Morton,
	Larry,
	Wendy,
	Iggy,
	Roy,
	Ludwig,
	PropellerBox = 128
}

export const enum ThemeId {
	Underwater = 4
}

export class MarioMakerService {
	public readonly baseURL = new URL('https://tgrcode.com/mm2/');

	public getLevelInfo(code: string) {
		const url = new URL(`level_info/${code}`, this.baseURL);
		return retryable(() => fetch<LevelInfoResponse>(url));
	}

	public getMakerInfo(code: string) {
		const url = new URL(`user_info/${code}`, this.baseURL);
		return retryable(() => fetch<MakerInfoResponse>(url));
	}

	public async getLevelData(code: string) {
		const url = new URL(`level_data/${code}`, this.baseURL);
		const res = await retryable(() => fetch(url, FetchResultTypes.Buffer));

		const course = MarioMakerService.decryptCourse(res);
		return MarioMakerService.decodeCourse(course);
	}

	public getLevelThumbnail(code: string) {
		return new URL(`level_thumbnail/${code}`, this.baseURL).toString();
	}

	public getLevelImage(code: string) {
		return new URL(`level_entire_thumbnail/${code}`, this.baseURL).toString();
	}

	public static readonly badgeEmojis: Record<number, string> = {
		1: Emoji.GoldRibbon,
		2: Emoji.SilverRibbon,
		3: Emoji.BronzeRibbon,
		4: Emoji.GoldMedal,
		5: Emoji.SilverMedal,
		6: Emoji.BronzeMedal
	};

	public static formatNameShort(user: MakerInfoResponse) {
		const badges = user.badges.map((badge) => this.badgeEmojis[badge.rank]);
		return `${user.name}${badges.length ? ` [${badges.join('')}]` : ''}`;
	}

	public static formatCode(code: string) {
		return code.match(/.{3}/g)!.join('-');
	}

	public static resolveCode(code: string) {
		const codeSegmentRegex = String.raw`((?:[0-9]|[a-h]|[j-n]|[p-y]){3})(?:\-|\s)?`;
		const codeRegex = new RegExp(`^${codeSegmentRegex.repeat(3)}$`, 'i');

		return codeRegex.exec(code)?.slice(1).join('');
	}

	private static readonly levelDataKeyTable = Uint32Array.from([
		0x7ab1c9d2, 0xca750936, 0x3003e59c, 0xf261014b, 0x2e25160a, 0xed614811, 0xf1ac6240, 0xd59272cd, 0xf38549bf, 0x6cf5b327, 0xda4db82a,
		0x820c435a, 0xc95609ba, 0x19be08b0, 0x738e2b81, 0xed3c349a, 0x045275d1, 0xe0a73635, 0x1debf4da, 0x9924b0de, 0x6a1fc367, 0x71970467,
		0xfc55abeb, 0x368d7489, 0x0cc97d1d, 0x17cc441e, 0x3528d152, 0xd0129b53, 0xe12a69e9, 0x13d1bdb7, 0x32eaa9ed, 0x42f41d1b, 0xaea5f51f,
		0x42c5d23c, 0x7cc742ed, 0x723ba5f9, 0xde5b99e3, 0x2c0055a4, 0xc38807b4, 0x4c099b61, 0xc4e4568e, 0x8c29c901, 0xe13b34ac, 0xe7c3f212,
		0xb67ef941, 0x08038965, 0x8afd1e6a, 0x8e5341a3, 0xa4c61107, 0xfbaf1418, 0x9b05ef64, 0x3c91734e, 0x82ec6646, 0xfb19f33e, 0x3bde6fe2,
		0x17a84cca, 0xccdf0ce9, 0x50e4135c, 0xff2658b2, 0x3780f156, 0x7d8f5d68, 0x517cbed1, 0x1fcddf0d, 0x77a58c94
	]);

	private static decryptCourse(buffer: Buffer) {
		const end = buffer.slice(-0x30);

		const randomState = this.generateRandomState(
			end.readUInt32LE(0x10), //
			end.readUInt32LE(0x14),
			end.readUInt32LE(0x18),
			end.readUInt32LE(0x1c)
		);

		const keyState = this.generateKeyState(randomState);

		const keyStateU8Array = keyState.flatMap((u32) => [
			u32 & 0x000000ff, //
			(u32 & 0x0000ff00) >> 8,
			(u32 & 0x00ff0000) >> 16,
			(u32 & 0xff000000) >> 24
		]);

		const key = Buffer.from(keyStateU8Array);
		const iv = end.slice(0, 16);

		const decipher = createDecipheriv('aes-128-cbc', key, iv);
		return decipher.update(buffer.slice(0x10)).slice(0, -0x20);
	}

	private static decodeCourse(buffer: Buffer) {
		const header = buffer.subarray(0, 0x200);
		const overworld = buffer.subarray(0x200, 0x2dee0);
		const subworld = buffer.subarray(0x2e0e0);

		const course = {
			timeLimit: header.readUInt16LE(0x4),
			hasClearCondition: Boolean(header.readUInt8(0xf)),
			style: this.courseStyles[header.subarray(0xf1, 0xf1 + 2).toString()],
			title: header
				.subarray(0xf4, 0xf4 + 64)
				.toString('utf16le')
				.split('\0')[0],
			description: header
				.subarray(0x136, 0x136 + 150)
				.toString('utf16le')
				.split('\0')[0],
			themes: [overworld.readUInt8(), subworld.readUInt8()],
			autoscroll: Boolean(overworld.readUInt8(0x1) || subworld.readUInt8(0x1)),
			isNight: overworld.readUInt32LE(0x18) === 2 || subworld.readUInt32LE(0x18) === 2,
			objects: new Map<ObjectId, number>()
		};

		for (const body of [overworld, subworld]) {
			const objectCount = body.readUInt32LE(0x1c);
			const objects = body.subarray(0x48, 0x48 + objectCount * 0x20);

			const altItemFlag = 0x00000004 as const;

			for (let i = 0; i < objectCount; i++) {
				const objectData = objects.subarray(i * 0x20, i * 0x20 + 0x20);
				const id = objectData.readUInt16LE(0x18);

				const isAlt = objectData.readUInt32LE(0xc) & altItemFlag;
				const fullId = id + (isAlt ? 1000 : 0);

				const count = course.objects.get(fullId) ?? 0;
				course.objects.set(fullId, count + 1);
			}
		}

		return course;
	}

	private static readonly courseStyles: Record<string, 'SMB1' | 'SMB3' | 'SMW' | 'NSMBU' | '3DW'> = {
		M1: 'SMB1',
		M3: 'SMB3',
		MW: 'SMW',
		WU: 'NSMBU',
		'3W': '3DW'
	};

	private static generateRandomState(int1: number, int2: number, int3: number, int4: number): number[] {
		return int1 | int2 | int3 | int4 ? [int1, int2, int3, int4] : [1, 0x6c078967, 0x714acb41, 0x48077044];
	}

	private static generateKeyState(randomState: number[]) {
		const out: number[] = [];

		for (let i = 0; i < 4; i++) {
			for (let j = 0; j < 4; j++) {
				out[i] <<= 8;

				const entry = this.levelDataKeyTable[this.generateRandomKey(randomState) >>> 26];
				out[i] |= (entry >> ((this.generateRandomKey(randomState) >>> 27) & 24)) & 0xff;
			}
		}

		return out;
	}

	private static generateRandomKey(randomState: number[]) {
		let key = randomState[0] ^ (randomState[0] << 11);
		key ^= (key >>> 8) ^ randomState[3] ^ (randomState[3] >>> 19);

		randomState.shift();
		randomState.push(key);

		return key;
	}
}

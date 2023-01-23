import type { Snowflake } from 'discord.js';
import { Low, JSONFile } from 'lowdb';

const createDb = async <T>(name: string, defaultStruct: T) => {
	const adapter = new JSONFile(`data/${name}.json`);
	const db = new Low(adapter) as Low & { data: T };

	await db.read();
	db.data ??= defaultStruct;

	return db;
};

export const submissionLocks = await createDb('submissionLocks', [] as Snowflake[]);

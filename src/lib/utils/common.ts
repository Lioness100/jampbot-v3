import type { QueryError } from '@sapphire/fetch';
import { setTimeout } from 'node:timers/promises';

export const countryCodeToFlag = (countryCode: string) => {
	const regionalIndicatorOffset = 127_397 as const;
	return String.fromCodePoint(...[...countryCode].map((char) => regionalIndicatorOffset + char.codePointAt(0)!));
};

export const retryCodes = [408, 500, 502, 503, 504, 522, 524] as readonly number[];

export const retryable = async <T>(fetchFn: () => Promise<T>, retries = 3, timeout = 300): Promise<T> => {
	return fetchFn().catch(async (error: QueryError) => {
		if (!retries || !retryCodes.includes(error.code)) {
			throw error;
		}

		await setTimeout(timeout);
		return retryable(fetchFn, retries - 1, timeout * 2);
	});
};

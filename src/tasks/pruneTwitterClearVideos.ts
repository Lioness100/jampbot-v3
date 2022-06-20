/* eslint-disable unicorn/no-array-reduce */
import { env } from '#root/config';
import { blockQuote } from '@discordjs/builders';
import { container } from '@sapphire/framework';
import { chunk, codeBlock } from '@sapphire/utilities';
import { stripIndents } from 'common-tags';

const consoleTimeLabel = 'pruneTwitterClearVideos' as const;
const tweetIdRegex = /\/(?<id>\d{17,19})/;

export const pruneTwitterClearVideos = async () => {
	console.log('Pruning Twitter clear videos...');
	console.time(consoleTimeLabel);

	const levels = await container.makerTeams.getLevels();
	const videos = levels
		.filter(({ videos }) => videos)
		.map(({ code, videos }) => {
			const videoEntries = videos!
				.split(',')
				.filter((url) => new URL(url).pathname === 'https://twitter.com')
				.map((url) => [tweetIdRegex.exec(url)!.groups!.id, url] as const);

			return { code, videos: new Map(videoEntries) };
		});

	const deletedVideos: { code: string; url: string }[] = [];
	for (const [idx, videoChunk] of chunk(
		videos.flatMap(({ videos }) => [...videos.keys()]),
		100
	).entries()) {
		console.log('Fetching levels...', idx * 100);

		const res = await container.twitter.client.tweets(videoChunk);
		if (!res.errors?.length) {
			continue;
		}

		const deleted = res.errors.map(({ value }) => {
			const level = videos.find(({ videos }) => videos.has(value!))!;
			return { code: level.code, url: level.videos.get(value!)! };
		});

		deletedVideos.push(...deleted);
	}

	console.timeEnd(consoleTimeLabel);

	if (deletedVideos.length) {
		const channel = container.client.channels.cache.get(env.LOG_CHANNEL_ID);
		if (!channel?.isText()) {
			return;
		}

		const groupedVids = deletedVideos.reduce((acc, { code, url }) => {
			acc.set(code, [...(acc.get(code) ?? []), url]);
			return acc;
		}, new Map<string, string[]>());

		const commands = [...groupedVids.entries()].map(([code, urls]) => `!removevids ${code} ${urls}`);
		const content = stripIndents`
				I found ${deletedVideos.length} deleted clear videos on Twitter!
				You can delete ${deletedVideos.length === 1 ? 'it' : 'them'} with ${deletedVideos.length === 1 ? 'this' : 'these'} commands:
				${blockQuote(codeBlock('', commands.join('\n')))}
			`;

		await channel.send(content);
	}
};

import { env } from '#root/config';
import { MarioMakerService } from '#services/MarioMakerService';
import { blockQuote } from '@discordjs/builders';
import type { QueryError } from '@sapphire/fetch';
import { container } from '@sapphire/framework';
import { chunk, codeBlock } from '@sapphire/utilities';
import { stripIndents } from 'common-tags';

const consoleTimeLabel = 'pruneLevels' as const;

export const pruneLevels = async () => {
	console.log('Pruning levels...');
	console.time(consoleTimeLabel);

	const levels = await container.makerTeams.getLevels();
	const deletedLevels: string[] = [];

	for (const levelChunk of chunk(levels, 100)) {
		while (true) {
			const res = await container.marioMaker
				.getLevelInfoMultiple(levelChunk.map(({ code }) => MarioMakerService.resolveCode(code)!))
				.catch((error: QueryError) => {
					const body = error.toJSON() as { course_id: string };
					const displayCode = MarioMakerService.formatCode(body.course_id);

					const idx = levelChunk.findIndex(({ code }) => code === displayCode);
					levelChunk.splice(0, idx + 1);

					deletedLevels.push(displayCode);
					return null;
				});

			if (res) {
				break;
			}
		}
	}

	console.timeEnd(consoleTimeLabel);

	if (deletedLevels.length) {
		const channel = container.client.channels.cache.get(env.LOG_CHANNEL_ID);
		if (!channel?.isText()) {
			return;
		}

		const commands = deletedLevels.map((code) => `!modremovelevel ${code} Deleted in game`);
		const content = stripIndents`
				I found ${deletedLevels.length} deleted levels!
				You can delete ${deletedLevels.length === 1 ? 'it' : 'them'} with ${deletedLevels.length === 1 ? 'this' : 'these'} commands:
				${blockQuote(codeBlock('', commands.join('\n')))}
			`;

		await channel.send(content);
	}
};

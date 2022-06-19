/* eslint-disable unicorn/numeric-separators-style */
/* eslint-disable unicorn/prefer-switch */
import { env } from '#root/config';
import { createEmbed } from '#utils/responses';
import { MarioMakerService, ObjectId, ThemeId } from '#services/MarioMakerService';
import { ApplyOptions } from '@sapphire/decorators';
import { type Events, Listener } from '@sapphire/framework';
import type { Message, TextChannel } from 'discord.js';
import { codeBlock, inlineCode, quote } from '@discordjs/builders';
import { stripIndents } from 'common-tags';

@ApplyOptions({ enabled: MessageCreateListener.canRun() })
export class MessageCreateListener extends Listener<typeof Events.MessageCreate> {
	public override async run(message: Message) {
		if (message.author.id !== env.SHELLBOT_USER_ID) {
			return;
		}

		await this.handleLevelSubmit(message);
	}

	public async handleLevelSubmit(message: Message) {
		const match = /The level .+ \((?<code>.+)\) has been added/.exec(message.content);
		if (!match?.groups) {
			return false;
		}

		const { code } = match.groups;
		const resolvedCode = MarioMakerService.resolveCode(code)!;

		const submitted = await this.container.makerTeams.getLevel(code);
		const level = await this.container.marioMaker.getLevelData(resolvedCode);
		if (!level) {
			return true;
		}

		const suggestedTags: string[] = [];
		const warnings: string[] = [];

		if (submitted) {
			const info = await this.container.marioMaker.getLevelInfo(resolvedCode);
			if (info && submitted.maker_id && info.uploader.code !== MarioMakerService.resolveCode(submitted.maker_id)) {
				warnings.push(
					`Registered maker ID (${submitted.maker_id}) does not match the maker ID of the level (${MarioMakerService.formatCode(
						info.uploader.code
					)})`
				);
			}

			if (level.title !== submitted.level_name) {
				warnings.push(`Submitted level name (${submitted.level_name}) does not match actual level name (${level.title})`);
			}

			const submittedStyle = submitted.tags.split(',')[0];
			if (submitted && level.style !== submittedStyle) {
				warnings.push(`Submitted level style (${submittedStyle}) does not match actual level style (${level.style})`);
			}
		}

		const title = level.title.toLowerCase();
		const description = level.description.toLowerCase();

		if (!description.includes('#tj') && !title.includes('#tj') && !description.includes('#teamjamp') && !title.includes('#teamjamp')) {
			warnings.push('Level does not have #TJ or #TeamJamp in the title or description');
		}

		if (
			description.includes('#tjo') ||
			title.includes('#tjo') ||
			description.includes('#teamjampolympics') ||
			title.includes('#teamjampolympics')
		) {
			suggestedTags.push('Jamp Olympics');
		}

		if (level.autoscroll) {
			suggestedTags.push('Autoscroll');
		}

		if (level.timeLimit <= 100) {
			suggestedTags.push('Speedrun');
		}

		if (level.isNight) {
			suggestedTags.push('Night Themes');
		}

		const checkPoints = level.objects.get(ObjectId.Checkpoint) ?? 0;
		suggestedTags.push(`${checkPoints}CP`);

		if (level.themes.includes(ThemeId.Underwater)) {
			suggestedTags.push('Water');
		}

		if (level.objects.has(ObjectId.SuperBall)) {
			suggestedTags.push('Superball');
		}

		if (level.objects.has(ObjectId.FireFlower)) {
			suggestedTags.push('Fire Flower');
		}

		if (level.objects.has(ObjectId.YoshiOrBoot)) {
			if (level.style === 'SMB1' || level.style === 'SMB3') {
				suggestedTags.push('Boots');
			} else {
				suggestedTags.push('Yoshi');
			}
		}

		if (level.objects.has(ObjectId.MasterSword)) {
			suggestedTags.push('Link');
		}

		const hasPropellorBox = level.objects.has(ObjectId.PropellerBox);
		if (hasPropellorBox || level.objects.has(ObjectId.BigMushroomOrRaccoonOrPropellorOrCatOrCape)) {
			if (level.style === 'SMB1') {
				suggestedTags.push('Big Mushroom');
			} else if (level.style === 'SMB3') {
				suggestedTags.push('Raccoon');
			} else if (level.style === 'SMW') {
				suggestedTags.push('Cape');
			} else if (level.style === 'NSMBU' || hasPropellorBox) {
				suggestedTags.push('Propeller');
			} else if (level.style === '3DW') {
				suggestedTags.push('Cat');
			}
		}

		if (level.objects.has(ObjectId.FrogOrSMB2OrBalloonOrAcornOrBoomerang)) {
			if (level.style === 'SMB1') {
				suggestedTags.push('SMB2');
			} else if (level.style === 'SMB3') {
				suggestedTags.push('Frog Suit');
			} else if (level.style === 'SMW') {
				suggestedTags.push('P-Balloon');
			} else if (level.style === 'NSMBU') {
				suggestedTags.push('Acorn');
			} else if (level.style === '3DW') {
				suggestedTags.push('Boomerang');
			}
		}

		if (
			level.objects.has(ObjectId.Bowser) ||
			level.objects.has(ObjectId.BowserJr) ||
			level.objects.has(ObjectId.Iggy) ||
			level.objects.has(ObjectId.Larry) ||
			level.objects.has(ObjectId.Ludwig) ||
			level.objects.has(ObjectId.Lemmy) ||
			level.objects.has(ObjectId.Morton) ||
			level.objects.has(ObjectId.Roy) ||
			level.objects.has(ObjectId.Wendy)
		) {
			suggestedTags.push('Boss');
		}

		if (level.objects.has(ObjectId.Hammer)) {
			suggestedTags.push('Hammer');
		}

		if (level.objects.has(ObjectId.SuperStar)) {
			suggestedTags.push('Super Star');
		}

		if (level.objects.has(ObjectId.KoopaCar)) {
			suggestedTags.push('Koopa Car');
		}

		if (suggestedTags.length) {
			const content = stripIndents`
				Thank you for submitting your level! We have found some tags that may be helpful:
				${codeBlock(suggestedTags.join('\n'))}
				You may add them with the following command:
				${quote(inlineCode(`!addtags ${submitted.code} ${suggestedTags.join(', ')}`))}
			`;

			await message.channel.send(content).catch(() => null);
		}

		if (warnings.length) {
			const pendingChannel = message.guild!.channels.cache.find(({ name }) => name.includes(code.toLowerCase())) as TextChannel;
			if (pendingChannel) {
				const embed = createEmbed(stripIndents`
					I have flagged the following warnings on this level:
					${codeBlock(warnings.join('\n'))}
				`);

				await pendingChannel.send({ embeds: [embed] }).catch(() => null);
			}
		}

		return true;
	}

	public static canRun() {
		return Boolean(env.SHELLBOT_USER_ID);
	}
}

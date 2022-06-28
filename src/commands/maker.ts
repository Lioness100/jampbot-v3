import { Command } from '#structures/Command';
import { MarioMakerService } from '#services/MarioMakerService';
import { createEmbed, sendError } from '#utils/responses';
import { commaListsAnd, stripIndents } from 'common-tags';
import { blockQuote, bold, time, TimestampStyles } from '@discordjs/builders';
import { Emoji } from '#utils/constants';
import { countryCodeToFlag } from '#utils/common';

export class MakerCommand extends Command {
	public override async chatInputRun(interaction: Command.Interaction) {
		const codeInput = interaction.options.getString('code', true);
		const code = MarioMakerService.resolveCode(codeInput);

		if (!code) {
			return sendError(interaction, 'Invalid maker code');
		}

		await interaction.deferReply();
		const maker = await this.container.marioMaker.getMakerInfo(code);
		if (maker.error) {
			return sendError(interaction, 'Something went wrong');
		}

		const numberFormatter = new Intl.NumberFormat(interaction.locale, {
			notation: 'compact',
			compactDisplay: 'short'
		});

		const regionNames = new Intl.DisplayNames(interaction.locale, { type: 'region' });

		const clearRateDisplay = `${numberFormatter.format(maker.courses_cleared)}/${numberFormatter.format(maker.courses_played)} (${(
			maker.courses_cleared / maker.courses_played || 0
		).toFixed(2)}%)`;

		const deathRateDisplay = `${numberFormatter.format(maker.courses_deaths)}/${numberFormatter.format(maker.courses_attempted)} (${(
			maker.courses_deaths / maker.courses_attempted || 0
		).toFixed(2)}%)`;

		const vsWinRateDisplay = `${numberFormatter.format(maker.versus_won)}/${numberFormatter.format(maker.versus_plays)} (${(
			maker.versus_won / maker.versus_plays || 0
		).toFixed(2)}%)`;

		const lastUploadedLevelDisplay = maker.last_uploaded_level
			? `${time(maker.last_uploaded_level, TimestampStyles.RelativeTime)} (${time(maker.last_uploaded_level)})`
			: 'N/A';

		let content = stripIndents(commaListsAnd)`
			${countryCodeToFlag(maker.country)} ${bold('Country:')} ${regionNames.of(maker.country)}
			⌛ ${bold('Last Active:')} ${time(maker.last_active, TimestampStyles.RelativeTime)} (${time(maker.last_active)})
			💖 ${bold('Likes:')} ${numberFormatter.format(maker.likes)}
			😎 ${bold('Maker Points:')} ${numberFormatter.format(maker.maker_points)}
			🚩 ${bold('Level Clear Rate:')} ${clearRateDisplay}
			${Emoji.Spike} ${bold('Death Rate:')} ${deathRateDisplay}
			🏅 ${bold('VS Rank:')} ${maker.versus_rank_name}
			🏋️ ${bold('VS Win Rate:')} ${vsWinRateDisplay}
			😒 ${bold('VS Kills:')} ${numberFormatter.format(maker.versus_kills)}
			🌍 ${bold('Has Super World:')} ${maker.super_world_id ? 'Yes' : 'No'}
			🥷 ${bold('First Clears:')} ${numberFormatter.format(maker.first_clears)}
			🏇 ${bold('Wold Records:')} ${numberFormatter.format(maker.world_records)}
			📤 ${bold('Uploaded Levels:')} ${numberFormatter.format(maker.uploaded_levels)}
			📨 ${bold('Last Uploaded Level:')} ${lastUploadedLevelDisplay}
		`;

		if (maker.badges.length) {
			const badgesDisplay = maker.badges.map(({ rank, type_name }) => `${MarioMakerService.badgeEmojis[rank]} ${type_name}`).join('\n');

			content += `\n\n🏆 ${bold('Badges:')}\n${blockQuote(badgesDisplay)}`;
		}

		const embed = createEmbed(content)
			.setTitle(`${maker.name} [${MarioMakerService.formatCode(maker.code)}]`)
			.setThumbnail(maker.mii_image);

		await interaction.editReply({ embeds: [embed] });
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand(
			(command) =>
				command
					.setName('maker')
					.setDescription('Get maker info from a code!')
					.addStringOption((option) =>
						option //
							.setName('code')
							.setDescription('The maker code to get info from!')
							.setRequired(true)
					),
			{ idHints: ['985372059804790804'] }
		);
	}
}

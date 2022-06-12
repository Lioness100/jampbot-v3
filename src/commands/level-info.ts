import { Command } from '#structures/Command';
import { MarioMakerService } from '#services/MarioMakerService';
import { createEmbed, sendError } from '#utils/responses';
import { commaListsAnd, stripIndent } from 'common-tags';
import { bold, inlineCode, time, TimestampStyles } from '@discordjs/builders';
import { Emoji } from '#utils/constants';
import { Constants, MessageActionRow, MessageButton } from 'discord.js';

export class LevelInfoCommand extends Command {
	public override async chatInputRun(interaction: Command.Interaction) {
		const codeInput = interaction.options.getString('code', true);
		const code = MarioMakerService.resolveCode(codeInput);

		if (!code) {
			return sendError(interaction, 'Invalid level code');
		}

		await interaction.deferReply();
		const level = await this.container.marioMaker.getLevelInfo(code);
		if (level.error) {
			return sendError(interaction, "This level doesn't exist");
		}

		const numberFormatter = new Intl.NumberFormat(interaction.locale, {
			notation: 'compact',
			compactDisplay: 'short'
		});

		const clearRateDisplay = `${numberFormatter.format(level.clears)}/${numberFormatter.format(level.attempts)} (${level.clear_rate})`;

		const content = stripIndent(commaListsAnd)`
			${level.description}
		
			🧑‍💻 ${bold('Uploader:')} ${MarioMakerService.formatNameShort(level.uploader)} (${inlineCode(MarioMakerService.formatCode(level.uploader.code))})
			📥 ${bold('Uploaded:')} ${time(level.uploaded, TimestampStyles.RelativeTime)} (${time(level.uploaded)})
			💖 ${bold('Likes:')} ${level.likes}
			💔 ${bold('Boos:')} ${level.boos}
			🎨 ${bold('Style:')} ${level.game_style_name} (${level.theme_name})
			${Emoji.Spike} ${bold('Difficulty:')} ${level.difficulty_name}
			🏷️ ${bold('Tags:')} ${level.tags_name}
			${Emoji.MadLad} ${bold('Clear Rate:')} ${clearRateDisplay}
			🚩 ${bold('First Clear:')} ${MarioMakerService.formatNameShort(level.first_completer)}
			🏇 ${bold('Wold Record Holder:')} ${MarioMakerService.formatNameShort(level.record_holder)} (${level.world_record_pretty})
			⌛ ${bold('Upload Time:')} ${level.upload_time_pretty}
		`;

		const embed = createEmbed(content)
			.setAuthor({ name: level.uploader.name, iconURL: level.uploader.mii_image })
			.setTitle(`${level.name} (${MarioMakerService.formatCode(level.course_id)})`)
			.setThumbnail(this.container.marioMaker.getLevelThumbnail(code))
			.setImage(this.container.marioMaker.getLevelImage(code));

		const button = new MessageButton()
			.setLabel('Full Level Viewer')
			.setURL('https://tgrcode.com/level_viewer/')
			.setStyle(Constants.MessageButtonStyles.LINK);

		const row = new MessageActionRow().setComponents(button);
		await interaction.editReply({ embeds: [embed], components: [row] });
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand(
			(command) =>
				command
					.setName('level-info')
					.setDescription('Get level info from a code!')
					.addStringOption((option) =>
						option //
							.setName('code')
							.setDescription('The level code to get info from!')
							.setRequired(true)
					),
			{ idHints: ['984628089059442760'] }
		);
	}
}

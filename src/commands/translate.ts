import type { MessageContextMenuInteraction, User } from 'discord.js';
import { Command } from '@sapphire/framework';
import { ApplicationCommandType } from 'discord-api-types/v9';
import { createEmbed, sendError } from '#utils/responses';
import translate, { languages } from '@vitalets/google-translate-api';

export class TranslateCommand extends Command {
	public override async contextMenuRun(interaction: MessageContextMenuInteraction) {
		if (!interaction.targetMessage.content) {
			return sendError(interaction, 'This message has no content');
		}

		const locale = TranslateCommand.resolveLocale(interaction.locale);
		const res = await translate(interaction.targetMessage.content, { to: locale });

		const author = interaction.targetMessage.author as User;
		const from = languages[res.from.language.iso as keyof typeof languages];

		const embed = createEmbed(res.text)
			.setTitle(`${author.tag} said...`)
			.setFooter({ text: `Translated from ${from}` });

		await interaction.reply({ embeds: [embed], ephemeral: true });
	}

	private static resolveLocale(fullLocale: string) {
		if (fullLocale.startsWith('zh-')) {
			return fullLocale;
		}

		return fullLocale.split('-')[0];
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerContextMenuCommand(
			(builder) =>
				builder //
					.setName('Translate')
					.setType(ApplicationCommandType.Message),
			{ idHints: ['982121041688158248'] }
		);
	}
}

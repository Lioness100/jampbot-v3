import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import type { ButtonInteraction } from 'discord.js';
import { CustomId, parseCustomId } from '#utils/customIds';
import { createEmbed } from '#utils/responses';
import { LevelIdeaCommand } from '#root/commands/level-idea';

@ApplyOptions<InteractionHandler.Options>({ interactionHandlerType: InteractionHandlerTypes.Button })
export class TwitterButtonInteractionHandler extends InteractionHandler {
	public override async run(interaction: ButtonInteraction, [, [style]]: InteractionHandler.ParseResult<this>) {
		const embed = createEmbed(LevelIdeaCommand.generateIdea(style));
		await interaction.update({ embeds: [embed] });
	}

	public override parse(interaction: ButtonInteraction) {
		return parseCustomId(interaction.customId, [CustomId.LevelIdea]);
	}
}

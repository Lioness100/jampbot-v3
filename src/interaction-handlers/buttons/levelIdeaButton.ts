import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import type { ButtonInteraction } from 'discord.js';
import { CustomId } from '#utils/constants';
import { createEmbed } from '#utils/responses';
import { LevelIdeaCommand } from '#root/commands/level-idea';

@ApplyOptions<InteractionHandler.Options>({ interactionHandlerType: InteractionHandlerTypes.Button })
export class TwitterButtonInteractionHandler extends InteractionHandler {
	public override async run(interaction: ButtonInteraction, style: InteractionHandler.ParseResult<this>) {
		const embed = createEmbed(LevelIdeaCommand.generateIdea(style));
		await interaction.update({ embeds: [embed] });
	}

	public override parse(interaction: ButtonInteraction) {
		const [id, style] = interaction.customId.split('.');
		return id === CustomId.LevelIdea ? this.some(Number(style)) : this.none();
	}
}

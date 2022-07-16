import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import type { ButtonInteraction, Message } from 'discord.js';
import { CustomId, parseCustomId } from '#utils/customIds';
import type { EvalCommand } from '#root/commands/dev/eval';
import { sendError } from '#utils/responses';
import type { Command } from '#structures/Command';

@ApplyOptions<InteractionHandler.Options>({ interactionHandlerType: InteractionHandlerTypes.Button })
export class ReviseCodeButtonInteractionHandler extends InteractionHandler {
	public override async run(interaction: ButtonInteraction, [, [async, ephemeral, depth]]: InteractionHandler.ParseResult<this>) {
		const command = this.container.stores.get('commands').get('eval') as EvalCommand;
		const preconditionRes = await command.preconditions.chatInputRun({ user: interaction.user } as Command.Interaction, command);

		if (!preconditionRes.success) {
			return sendError(interaction, 'This button is not for you');
		}

		const message = interaction.message as Message;
		let code = '';

		const file = message.attachments.find(({ name }) => name === 'input.txt');
		if (file) {
			code = file.attachment.toString();
		} else {
			const [inputField] = message.embeds[0].fields;
			code = inputField!.value.slice('```js\n'.length, -'```'.length);
		}

		await command.sendForm(interaction, { async: async ?? null, ephemeral: ephemeral ?? null, depth: depth ?? null, code });
	}

	public override parse(interaction: ButtonInteraction) {
		return parseCustomId(interaction.customId, [CustomId.ReviseCode]);
	}
}

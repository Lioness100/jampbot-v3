import { Constants, MessageActionRow, MessageButton, Modal, TextInputComponent, type ButtonInteraction, FileOptions } from 'discord.js';
import { EmbedLimits } from '@sapphire/discord.js-utilities';
import { createEmbed } from '#utils/responses';
import { EmbedColor } from '#utils/constants';
import { createCustomId, CustomId } from '#utils/customIds';
import { isThenable } from '@sapphire/utilities';
import { Stopwatch } from '@sapphire/stopwatch';
import { codeBlock } from '@discordjs/builders';
import { Command } from '#structures/Command';
import { inspect } from 'node:util';
import { Buffer } from 'node:buffer';
import { Type } from '@sapphire/type';
import { env } from '#root/config';
import { ApplyOptions } from '@sapphire/decorators';

@ApplyOptions<Command.Options>({ preconditions: ['OwnerOnly'] })
export class EvalCommand extends Command {
	public override async chatInputRun(interaction: Command.Interaction) {
		const async = interaction.options.getBoolean('async');
		await this.sendForm(interaction, {
			async,
			depth: interaction.options.getInteger('depth'),
			ephemeral: interaction.options.getBoolean('ephemeral'),
			code: async ? "// const _ = await import('');" : null
		});
	}

	public async sendForm(
		interaction: Command.Interaction | ButtonInteraction,
		parameters: {
			async: boolean | null;
			code: string | null;
			depth: number | null;
			ephemeral: boolean | null;
		}
	) {
		const codeInput = new TextInputComponent() //
			.setCustomId(CustomId.CodeInput)
			.setLabel(`${parameters.async ? 'Async ' : ''}Code`)
			.setRequired(true)
			.setStyle('PARAGRAPH');

		if (parameters.code) {
			codeInput.setValue(parameters.code);
		}

		const row = new MessageActionRow<TextInputComponent>().setComponents(codeInput);
		const modal = new Modal().setTitle('Code Editor').setCustomId(CustomId.CodeForm).setComponents(row);

		await interaction.showModal(modal);
		const submission = await interaction.awaitModalSubmit({ time: 0 }).catch(() => null);

		if (!submission) {
			return;
		}

		await submission.deferReply({ ephemeral: parameters.ephemeral ?? false });
		const code = submission.fields.getTextInputValue(CustomId.CodeInput);

		const { result, success, type, elapsed } = await this.eval(interaction, code, parameters);
		const output = success ? codeBlock('js', result) : codeBlock('bash', result);

		const embed = createEmbed('', success ? EmbedColor.Primary : EmbedColor.Error);

		const inputLimitReached = code.length > EmbedLimits.MaximumFieldValueLength;
		const outputLimitReached = output.length > EmbedLimits.MaximumFieldValueLength;
		const tooLongMessage = `was too long! The result has been sent as a file.` as const;

		embed
			.setTitle(success ? 'Eval Result ✨' : 'Eval Error 💀')
			.addField('Input 🤖', inputLimitReached ? `Input ${tooLongMessage}` : codeBlock('js', code))
			.addField('Output 📥', outputLimitReached ? `Output ${tooLongMessage}` : output)
			.addField('Type 📝', codeBlock('ts', type), true)
			.addField('Elapsed ⏱', elapsed, true);

		const files: FileOptions[] = [];

		if (inputLimitReached) {
			files.push({ attachment: Buffer.from(code), name: 'input.txt' });
		}

		if (outputLimitReached) {
			files.push({ attachment: Buffer.from(output), name: 'output.txt' });
		}

		const customId = createCustomId(
			CustomId.ReviseCode,
			parameters.async ?? undefined,
			parameters.ephemeral ?? undefined,
			parameters.depth ?? undefined
		);

		const reviseButton = new MessageButton()
			.setCustomId(customId)
			.setEmoji('🔁')
			.setLabel('Revise')
			.setStyle(Constants.MessageButtonStyles.PRIMARY);

		const buttonRow = new MessageActionRow().setComponents(reviseButton);
		await submission.editReply({ embeds: [embed], components: [buttonRow], files });
	}

	private async eval(
		interaction: Command.Interaction | ButtonInteraction,
		code: string,
		parameters: {
			async: boolean | null;
			depth: number | null;
		}
	) {
		if (parameters.async) {
			code = `(async () => {\n${code}\n})();`;
		}

		let success = true;
		let result;

		const stopwatch = new Stopwatch();
		let elapsed = '';

		try {
			// This will serve as an alias for ease of use in the eval code.
			// @ts-expect-error 6133
			const i = interaction;

			// eslint-disable-next-line no-eval
			result = eval(code);
			elapsed = stopwatch.toString();

			if (isThenable(result)) {
				stopwatch.restart();
				result = await result;
				elapsed = stopwatch.toString();
			}
		} catch (error) {
			if (!elapsed) {
				elapsed = stopwatch.toString();
			}

			result = (error as Error).message ?? error;
			success = false;
		}

		stopwatch.stop();

		const type = new Type(result).toString();

		if (typeof result !== 'string') {
			result = inspect(result, { depth: parameters.depth });
		}

		return { result, success, type, elapsed };
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand(
			(builder) =>
				builder
					.setName(this.name)
					.setDescription('[owner only] Evaluate any JavaScript code')
					.addBooleanOption((option) =>
						option
							.setName('async')
							.setDescription('Whether to allow use of async/await. If set, the result will have to be returned')
							.setRequired(false)
					)
					.addBooleanOption((option) =>
						option //
							.setName('ephemeral')
							.setDescription('Whether to show the result ephemerally')
							.setRequired(false)
					)
					.addIntegerOption((option) =>
						option //
							.setName('depth')
							.setDescription('The depth of the displayed return type')
							.setRequired(false)
					),
			{ idHints: ['982845257249079306'], guildIds: [env.DEV_SERVER_ID] }
		);
	}
}

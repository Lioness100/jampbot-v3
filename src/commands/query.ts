import { Command } from '@sapphire/framework';
import { createEmbed, sendError } from '#utils/responses';
import { cutText } from '@sapphire/utilities';
import {
	AutoCompleteLimits,
	SelectMenuLimits,
	EmbedLimits,
	MessageLimits,
	PaginatedMessage,
	type PaginatedMessageAction
} from '@sapphire/discord.js-utilities';
import { ApplyOptions } from '@sapphire/decorators';
import { WolframService } from '#services/WolframService';
import { stripIndents } from 'common-tags';
import { MessageEmbed, Constants } from 'discord.js';
import { inlineCode } from '@discordjs/builders';

@ApplyOptions({ enabled: WolframService.canRun() })
export class QueryCommand extends Command {
	private static readonly examples = [
		'Derivative sin^2 x',
		'How many elements in the periodic table',
		'Who was Galileo',
		'What time is it in London',
		'Harry Potter cast',
		'When was Nintendo founded',
		'2005 lending interest rate in Argentina',
		'What is a plum',
		'What is the atomic radius of S',
		'Where did Achilles die',
		'Who was the tallest person ever born',
		'Why am I still single'
	];

	private readonly wolfram = new WolframService();
	public override async chatInputRun(interaction: Command.ChatInputInteraction) {
		await interaction.deferReply();

		const query = interaction.options.getString('query', true);
		const result = await this.wolfram.calculate(query);

		if (result.error) {
			return sendError(interaction, 'Something went wrong');
		}

		if (!result.success) {
			const description = stripIndents`
				Wolfram Alpha did not find any results for your query!
				${result.didyoumeans?.val ? `Did you mean "${result.didyoumeans.val}"?` : ''}
			`;

			return sendError(interaction, description, { suffix: false });
		}

		const inputInterpretation = result.pods.shift()!;
		const template = { content: `Input: ${inlineCode(inputInterpretation.subpods[0].plaintext)}` };

		const handler = new PaginatedMessage({ template, actions: [PaginatedMessage.defaultActions[0]] })
			.setSelectMenuOptions((idx) => ({ label: result.pods[idx - 1].title }))
			.setSelectMenuPlaceholder('Pick a result page...');

		const sources = Array.isArray(result.sources) ? result.sources : [result.sources];
		if (sources[0]?.url) {
			const actions = sources.map<PaginatedMessageAction>((source) => ({
				style: Constants.MessageButtonStyles.LINK,
				label: source!.text,
				url: source!.url,
				type: Constants.MessageComponentTypes.BUTTON
			}));

			handler.addActions(actions);
		}

		const info = Array.isArray(result.infos) ? result.infos[0] : result.infos;

		for (const pod of result.pods.slice(0, SelectMenuLimits.MaximumOptionsLength)) {
			if (pod.error) {
				continue;
			}

			handler.addPageEmbeds(() => {
				const embed = createEmbed().setTitle(pod.title);
				const embeds: MessageEmbed[] = [];

				if (pod.subpods.length === 1) {
					const [subpod] = pod.subpods;
					if (subpod.plaintext) {
						embed.setDescription(cutText(subpod.plaintext, EmbedLimits.MaximumDescriptionLength));
					}

					if (subpod.img) {
						embed.setImage(subpod.img.src);
					}

					embeds.push(embed);
				} else {
					for (const [idx, subpod] of pod.subpods.slice(0, MessageLimits.MaximumEmbeds).entries()) {
						const name = cutText(subpod.name || `${pod.title} Part ${idx + 1}`, EmbedLimits.MaximumFieldNameLength);
						const text = subpod.plaintext ? cutText(subpod.plaintext, EmbedLimits.MaximumFieldValueLength) : 'View attached image!';

						const subEmbed = new MessageEmbed(embed).setTitle(name).setDescription(text);

						if (subpod.img) {
							subEmbed.setImage(subpod.img.src);
						}

						embeds.push(subEmbed);
					}
				}

				if (info?.text) {
					embeds.at(-1)!.setFooter({ text: info.text });
				}

				return embeds;
			});
		}

		await handler.run(interaction);
	}

	public override async autocompleteRun(interaction: Command.AutocompleteInteraction) {
		const query = interaction.options.getFocused() as string;

		if (!query) {
			const options = QueryCommand.examples.map((name) => ({ name, value: name }));
			return interaction.respond(options);
		}

		const results = await this.wolfram.autocomplete(query);
		const options = [
			{ name: query, value: query },
			...results
				.slice(0, 25)
				.filter((query) => query.length <= AutoCompleteLimits.MaximumAmountOfOptions)
				.map((query) => ({ name: query, value: query }))
		];

		return interaction.respond(options);
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName('query')
				.setDescription('Query Wolfram|Alpha!')
				.addStringOption((builder) =>
					builder //
						.setName('query')
						.setDescription('The query to compute')
						.setAutocomplete(true)
						.setRequired(true)
				)
		);
	}
}

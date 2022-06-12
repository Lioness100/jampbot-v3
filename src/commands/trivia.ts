import { MessageButton, MessageActionRow, Message, Constants } from 'discord.js';
import { Command } from '#structures/Command';
import { OpenTDBService, QuestionDifficulty } from '#services/OpenTDBService';
import { createEmbed, sendError } from '#utils/responses';
import { bold, inlineCode, time, TimestampStyles } from '@discordjs/builders';
import { stripIndent } from 'common-tags';
import { Time } from '@sapphire/time-utilities';
import { cast } from '@sapphire/utilities';

export class TriviaCommand extends Command {
	private readonly api = new OpenTDBService();
	private static readonly emojis: Record<number, string> = {
		0: '1️⃣',
		1: '2️⃣',
		2: '3️⃣',
		3: '4️⃣'
	};

	public override async chatInputRun(interaction: Command.Interaction) {
		const category = interaction.options.getString('category') ?? undefined;
		const difficulty = (interaction.options.getString('difficulty') as QuestionDifficulty) ?? undefined;

		const question = await this.api.getQuestion({ category, difficulty });

		if (!question) {
			return sendError(interaction, 'I had an issue gathering trivia questions');
		}

		const idx = Math.floor(Math.random() * 3);
		const options = [...question.incorrect_answers];
		options.splice(idx, 0, question.correct_answer);

		const optionsDisplay = options
			.map((option, optionIdx) => `${bold(`${inlineCode((optionIdx + 1).toString())} -`)} ${decodeURIComponent(option)}`)
			.join('\n');

		const [difficultyName] = Object.entries(QuestionDifficulty).find(([, value]) => value === question.difficulty)!;
		const content = stripIndent`
			${bold(decodeURIComponent(question.question))}

			${bold('Category:')} ${decodeURIComponent(question.category)}
			${bold('Difficulty:')} ${difficultyName}
		
			${bold('Options')}
			${optionsDisplay}
		
			Your time is up ${time(Math.floor(Date.now() / 1000) + 15, TimestampStyles.RelativeTime)}!
		`;

		const buttons = options.map((_, optionIdx) =>
			new MessageButton() //
				.setCustomId(optionIdx.toString())
				.setEmoji(TriviaCommand.emojis[optionIdx])
				.setStyle('PRIMARY')
		);

		const row = new MessageActionRow().setComponents(buttons);

		const embed = createEmbed(content).setTitle('Trivia! 🎉');
		const message = (await interaction.reply({
			embeds: [embed],
			components: [row],
			fetchReply: true
		})) as Message;

		const button = await message
			.awaitMessageComponent({
				filter: async (buttonInteraction) => {
					if (buttonInteraction.user.id !== interaction.user.id) {
						await sendError(interaction, `This button is only for ${interaction.user}`);
						return false;
					}

					return true;
				},
				componentType: Constants.MessageComponentTypes.BUTTON,
				time: Time.Second * 15
			})
			.catch(() => null);

		for (const [componentIdx, component] of message.components[0].components.entries()) {
			const style =
				componentIdx === idx
					? Constants.MessageButtonStyles.SUCCESS
					: Number(button?.customId) === componentIdx
					? Constants.MessageButtonStyles.DANGER
					: Constants.MessageButtonStyles.SECONDARY;

			cast<MessageButton>(component).setStyle(style).setDisabled(true);
		}

		embed.setDescription(embed.description!.replace(/.+$/, ''));

		await message.edit({ embeds: [embed], components: message.components });
		const answer = bold(decodeURIComponent(options[idx]));

		if (!button) {
			return sendError(interaction, `You ran out of time! The answer is ${answer}`, { ephemeral: false });
		}

		if (idx === Number(button.customId)) {
			const resultEmbed = createEmbed(`✅ Correct! The answer is ${answer}`);
			await button.reply({ embeds: [resultEmbed] });
		} else {
			await sendError(button, `Sorry, the answer is ${answer}`, { ephemeral: false });
		}
	}

	public override async registerApplicationCommands(registry: Command.Registry) {
		const categories = await this.api.getCategories();
		const videoGamesIdx = categories.findIndex((category) => category.name.includes('Video Games'));
		const videoGamesCategory = categories[videoGamesIdx];

		categories.splice(videoGamesIdx, 1);
		categories.unshift({ ...videoGamesCategory, name: `✨ ${videoGamesCategory.name}` });

		const difficulties = Object.entries(QuestionDifficulty).map(([key, value]) => ({ name: key, value }));

		registry.registerChatInputCommand(
			(command) =>
				command
					.setName('trivia')
					.setDescription('Play a game of trivia!')
					.addStringOption((option) =>
						option
							.setName('category')
							.setDescription('The category of questions to play trivia with. If omitted, the bot will use all categories.')
							.setChoices(...categories)
							.setRequired(false)
					)
					.addStringOption((option) =>
						option
							.setName('difficulty')
							.setDescription('The difficulty of questions to play trivia with. Defaults to easy.')
							.setChoices(...difficulties)
							.setRequired(false)
					),
			{ idHints: ['984277875173785630'] }
		);
	}
}

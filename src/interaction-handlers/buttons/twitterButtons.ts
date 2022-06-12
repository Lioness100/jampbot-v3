import { resolveAPIStructure } from '#utils/interactions';
import { TwitterService } from '#services/TwitterService';
import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { type ButtonInteraction, Message, type MessageButton, Constants, Modal, MessageActionRow, TextInputComponent } from 'discord.js';
import { CustomId } from '#utils/constants';
import { env } from '#root/config';
import { createEmbed } from '#utils/responses';

@ApplyOptions<InteractionHandler.Options>({ interactionHandlerType: InteractionHandlerTypes.Button, enabled: TwitterService.canRun() })
export class TwitterButtonInteractionHandler extends InteractionHandler {
	private static readonly validIds = [
		CustomId.Like,
		CustomId.Dislike,
		CustomId.Retweet,
		CustomId.UnRetweet,
		CustomId.Reply,
		CustomId.Block,
		CustomId.Unblock
	];

	public override async run(interaction: ButtonInteraction) {
		const tweetRegex = /\/(?<author>\d+)\/status\/(?<id>\d+)/;
		const message = resolveAPIStructure(interaction.message, Message);
		const match = tweetRegex.exec(message.content);

		if (!match?.groups) {
			return;
		}

		const { author, id } = match.groups;

		const component = message.components[0].components.find(({ customId }) => customId === interaction.customId) as MessageButton;
		switch (interaction.customId) {
			case CustomId.Like: {
				await this.container.twitter.api.like(env.TWITTER_ACCOUNT_ID, id);
				component.setCustomId(CustomId.Dislike).setEmoji('👎').setLabel('Unlike').setStyle(Constants.MessageButtonStyles.DANGER);
				break;
			}

			case CustomId.Dislike: {
				await this.container.twitter.api.unlike(env.TWITTER_ACCOUNT_ID, id);
				component.setCustomId(CustomId.Like).setEmoji('👍').setLabel('Like').setStyle(Constants.MessageButtonStyles.PRIMARY);
				break;
			}

			case CustomId.Retweet: {
				await this.container.twitter.api.retweet(env.TWITTER_ACCOUNT_ID, id);
				component.setCustomId(CustomId.UnRetweet).setLabel('Unretweet').setStyle(Constants.MessageButtonStyles.DANGER);
				break;
			}

			case CustomId.UnRetweet: {
				await this.container.twitter.api.unretweet(env.TWITTER_ACCOUNT_ID, id);
				component.setCustomId(CustomId.Retweet).setLabel('Retweet').setStyle(Constants.MessageButtonStyles.PRIMARY);
				break;
			}

			case CustomId.Reply: {
				const replyInput = new TextInputComponent()
					.setCustomId(CustomId.ReplyInput)
					.setMaxLength(280)
					.setLabel('Reply Content')
					.setStyle('PARAGRAPH');

				const row = new MessageActionRow<TextInputComponent>().setComponents(replyInput);
				const modal = new Modal().setCustomId(CustomId.ReplyForm).setTitle('Reply to Tweet').setComponents(row);

				await interaction.showModal(modal);
				const submitted = await interaction
					.awaitModalSubmit({ time: 0, filter: (submitted) => submitted.user.id === interaction.user.id })
					.catch(() => null);

				if (!submitted) {
					return;
				}

				const reply = submitted.fields.getTextInputValue(CustomId.ReplyInput);
				await this.container.twitter.api.reply(env.TWITTER_ACCOUNT_ID, id, { text: reply });

				const embed = createEmbed(`✅ Reply sent!`);
				await submitted.reply({ embeds: [embed], ephemeral: true });
				break;
			}

			case CustomId.Block: {
				await this.container.twitter.api.block(env.TWITTER_ACCOUNT_ID, author);
				component.setCustomId(CustomId.Unblock).setEmoji('👋').setLabel('Unblock').setStyle(Constants.MessageButtonStyles.PRIMARY);
				break;
			}

			case CustomId.Unblock: {
				await this.container.twitter.api.unblock(env.TWITTER_ACCOUNT_ID, author);
				component.setCustomId(CustomId.Block).setEmoji('🤐').setLabel('Block').setStyle(Constants.MessageButtonStyles.PRIMARY);
				break;
			}
		}

		if (interaction.customId !== CustomId.Reply) {
			await interaction.update({ components: message.components });
		}
	}

	public override parse(interaction: ButtonInteraction) {
		return TwitterButtonInteractionHandler.validIds.includes(interaction.customId as typeof TwitterButtonInteractionHandler['validIds'][number])
			? this.some()
			: this.none();
	}
}

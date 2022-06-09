/* eslint-disable @typescript-eslint/no-invalid-void-type */
import { MessageEmbed, type ColorResolvable } from 'discord.js';
import { EmbedColor, Emoji } from '#utils/constants';
import { italic } from '@discordjs/builders';
import { safelyReplyToInteraction, SafeReplyToInteractionParameters } from '@sapphire/discord.js-utilities';

/**
 * Creates an embed.
 */
export const createEmbed = (description?: string, color: ColorResolvable = EmbedColor.Primary) => {
	return new MessageEmbed({ color, description });
};

/**
 * Sends an error response from an interaction.
 */
export const sendError = async (
	// "& InteractionResponseFields" will ensure the interaction is repliable to.
	interaction: SafeReplyToInteractionParameters['messageOrInteraction'],
	description: string,
	rawOptions?: { ephemeral?: boolean; tip?: string; prefix?: string; suffix?: boolean }
) => {
	const options = {
		ephemeral: true,
		suffix: true,
		prefix: `${Emoji.SadBowser} `,
		...rawOptions
	};

	// Core sapphire errors end in ".", so that needs to be accounted for.
	if (description.endsWith('.') && options.suffix) {
		description = description.slice(0, -1);
	}

	const formattedError = `${options.prefix}${description}${options.suffix ? '!' : ''}`;
	const formattedDescription = `${formattedError}${options.tip ? `\n${italic(`💡${options.tip}`)}` : ''}`;

	const payload = {
		embeds: [createEmbed(formattedDescription, EmbedColor.Error)],
		ephemeral: options.ephemeral ?? true
	};

	// eslint-disable-next-line @typescript-eslint/unbound-method
	await safelyReplyToInteraction({
		interactionReplyContent: payload,
		interactionEditReplyContent: payload,
		componentUpdateContent: payload,
		messageOrInteraction: interaction
	});
};

// This method of resolving `Message` instances from interaction replies should be used if channel or guild sweeping is
// implemented, as it's only guarranteed to return a `Message` if the channel it was sent in is cached (and if the bot
// is in the guild where the message was sent, although we don't need to worry about that). Until then, we can safely
// cast as `Message` when using the `fetchReply` option. Note that the `Message` constructor has been private since
// v13.2.0 (discordjs/discord.js#6732), so the Reflect.construct hack is necessary (@ts-ignore would also work).

// /**
//  * Replies to an interaction and resolves a `Message` instance from the new message.
//  */
// export const replyAndFetch = async (interaction: CommandInteraction, options: Omit<Parameters<CommandInteraction['reply']>, 'fetchReply'>) => {
// 	const message = await interaction.reply({ ...options, fetchReply: true });
// 	return message instanceof Message ? message : Reflect.construct(Message, [interaction.client, message]);
// };

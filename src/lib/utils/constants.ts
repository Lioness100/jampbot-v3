import { pathToFileURL } from 'node:url';
import { getRootData } from '@sapphire/pieces';
import { Constants } from 'discord.js';

export const rootURL = pathToFileURL(`${getRootData().root}/`);

export enum EmbedColor {
	Primary = Constants.Colors.AQUA,
	Secondary = Constants.Colors.BLUE,
	Error = Constants.Colors.RED
}

export const enum CustomId {
	CodeInput = 'code-input',
	CodeForm = 'code-form',
	ReplyInput = 'reply-input',
	ReplyForm = 'reply-form',
	Like = 'like-button',
	Dislike = 'dislike-button',
	Retweet = 'retweet-button',
	UnRetweet = 'unretweet-button',
	Reply = 'reply-button',
	Block = 'block-button',
	Unblock = 'unblock-button'
}

// You can replace the "name" portion of the emoji with "_" and it will always work.
export const enum Emoji {
	PridePog = '<:_:796585159607975947>'
}

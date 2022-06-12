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
	PridePog = '<:_:796585159607975947>',
	SadBowser = '<:_:717925128331329607>',
	Spike = '<:_:946467215954300949>',
	MadLad = '<:_:699621427262914660>',
	GoldRibbon = '<:_:984631632302571562>',
	GoldMedal = '<:_:984631705786777630>',
	SilverRibbon = '<:_:984631888348086322>',
	SilverMedal = '<:_:984631739756474418>',
	BronzeRibbon = '<:_:984631770702045254>',
	BronzeMedal = '<:_:984631679773736980>'
}

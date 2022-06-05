import { env } from '#root/config';
import { Emoji, rootURL } from '#utils/constants';
import { bold, channelMention } from '@discordjs/builders';
import { createCanvas, GlobalFonts, Image } from '@napi-rs/canvas';
import { ApplyOptions } from '@sapphire/decorators';
import { Listener, Events } from '@sapphire/framework';
import type { GuildMember } from 'discord.js';
import { readFile } from 'node:fs/promises';
import { fileURLToPath, URL } from 'node:url';
import { dedent } from 'ts-dedent';

const banner = new Image();
banner.src = await readFile(new URL('../assets/images/welcome-banner.png', rootURL));

@ApplyOptions({ enabled: Boolean(env.WELCOME_CHANNEL_ID) })
export class GuildMemberAddListener extends Listener<typeof Events.GuildMemberAdd> {
	public override onLoad() {
		const url = new URL('../assets/fonts/Mario Maker.ttf', rootURL);
		GlobalFonts.registerFromPath(fileURLToPath(url), 'Mario Maker');

		return super.onLoad();
	}

	public async run(member: GuildMember) {
		const canvas = createCanvas(700, 250);
		const ctx = canvas.getContext('2d');

		ctx.drawImage(banner, 0, 0, 700, 250);
		const username = member.user.username.toUpperCase();

		let font = 95;
		let num = 1.4;
		do {
			num += 0.07;
			ctx.font = `${(font -= 10)}px Mario Maker, malgun gothic, arial`;
		} while (ctx.measureText(username).width > 450);

		ctx.fillText(username, 250, 250 / num);

		ctx.beginPath();
		ctx.arc(125, 125, 100, 0, Math.PI * 2, true);
		ctx.closePath();
		ctx.clip();

		const channel = this.client.channels.cache.get(env.WELCOME_CHANNEL_ID);
		if (!channel?.isText()) {
			return this.unload();
		}

		const informationChannel = channelMention(env.INFORMATION_CHANNEL_ID);
		await channel.send({
			content: dedent`
				Hi ${member.toString()}, welcome to ${bold('Team Jamp!')} To find out more about what we do here, please read ${informationChannel}!
				Have a great time, and remember to contact a mod with any questions ${Emoji.PridePog}
			`,
			files: [canvas.toBuffer('image/png')]
		});
	}
}

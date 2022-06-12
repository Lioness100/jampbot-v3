import '@sapphire/plugin-logger/register';
import 'dotenv/config';

import { SapphireClient, ApplicationCommandRegistries, RegisterBehavior, Piece, container } from '@sapphire/framework';
import { PaginatedMessage } from '@sapphire/discord.js-utilities';
import { clientOptions } from '#root/config';
import { TwitterService } from '#services/TwitterService';
import { MarioMakerService } from '#services/MarioMakerService';
import cleanup from 'node-cleanup';

cleanup(() => {
	client.destroy();
	container.twitter?.stream.destroy();
});

const client = new SapphireClient(clientOptions);

ApplicationCommandRegistries.setDefaultBehaviorWhenNotIdentical(RegisterBehavior.Overwrite);

// This reply is overridden for a much less passive aggressive tone.
PaginatedMessage.wrongUserInteractionReply = (user) => `❌ Only ${user} can use these buttons!`;

// Utility - saves a lot of characters. A lot.
Object.defineProperty(Piece.prototype, 'client', { get: () => container.client });

await client.login();

if (TwitterService.canRun()) {
	container.twitter = new TwitterService();
	await container.twitter.init();
}

container.marioMaker = new MarioMakerService();

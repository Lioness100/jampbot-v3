import type { TwitterService } from '#services/TwitterService';
import type { SapphireClient } from '@sapphire/framework';

declare module '@sapphire/framework' {
	interface Preconditions {
		OwnerOnly: never;
	}
}

declare module '@sapphire/pieces' {
	interface Container {
		twitter: TwitterService;
	}

	interface Piece {
		client: SapphireClient;
	}
}

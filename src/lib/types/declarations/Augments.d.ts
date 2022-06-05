import type { TwitterNotifier } from '#services/TwitterNotifier';
import type { SapphireClient } from '@sapphire/framework';

declare module '@sapphire/framework' {
	interface Preconditions {
		OwnerOnly: never;
	}
}

declare module '@sapphire/pieces' {
	interface Container {
		twitter: TwitterNotifier;
	}

	interface Piece {
		client: SapphireClient;
	}
}

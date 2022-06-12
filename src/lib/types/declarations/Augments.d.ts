import type { MakerTeamsService } from '#services/MakerTeamsService';
import type { MarioMakerService } from '#services/MarioMakerService';
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
		marioMaker: MarioMakerService;
	}

	interface Piece {
		client: SapphireClient;
	}
}

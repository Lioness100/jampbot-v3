import { type ClientOptions, Collection, LimitedCollection } from 'discord.js';
import { GatewayIntentBits } from 'discord-api-types/v9';
import { cleanEnv, str } from 'envalid';
import { LogLevel } from '@sapphire/framework';
import process from 'node:process';

// Unless explicitly defined, set NODE_ENV to development.
process.env.NODE_ENV ??= 'development';

const optionalStringPredicate = str({ default: '' });

export const env = cleanEnv(process.env, {
	DISCORD_TOKEN: str(),
	DEV_SERVER_ID: optionalStringPredicate,
	TWITTER_API_KEY: optionalStringPredicate,
	TWITTER_API_KEY_SECRET: optionalStringPredicate,
	TWITTER_ACCESS_TOKEN: optionalStringPredicate,
	TWITTER_ACCESS_TOKEN_SECRET: optionalStringPredicate,
	TWITTER_BEARER_TOKEN: optionalStringPredicate,
	TWITTER_NOTIFICATION_CHANNEL_ID: optionalStringPredicate,
	TWITTER_ACCOUNT_ID: optionalStringPredicate,
	WELCOME_CHANNEL_ID: optionalStringPredicate,
	INFORMATION_CHANNEL_ID: optionalStringPredicate,
	WOLFRAM_APP_ID: optionalStringPredicate,
	SHELLBOT_USER_ID: optionalStringPredicate,
	LOG_CHANNEL_ID: optionalStringPredicate,
	SUBMISSION_LOCKED_ROLE_ID: optionalStringPredicate
});

const necessaryManagers: ReadonlySet<string> = new Set([
	'GuildManager', //
	'GuildChannelManager',
	'ChannelManager',
	'RoleManager',
	'PermissionOverwriteManager'
]);

export const clientOptions: ClientOptions = {
	// Intents dictate what events the client will receive.
	intents: GatewayIntentBits.Guilds | GatewayIntentBits.GuildMembers | GatewayIntentBits.GuildMessages,
	logger: { level: env.isProduction ? LogLevel.Info : LogLevel.Debug },
	loadDefaultErrorListeners: false,
	makeCache: (manager) => {
		// We don't need to cache anything. However, discord.js' internals currently require the five caches described
		// in `necessaryManagers`, so we let those ones go.
		if (necessaryManagers.has(manager.name)) {
			return new Collection();
		}

		return new LimitedCollection({ maxSize: 0 });
	}
};

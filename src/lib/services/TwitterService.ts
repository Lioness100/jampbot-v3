import { ETwitterStreamEvent, type TweetV2SingleStreamResult, TwitterApi, type TweetStream } from 'twitter-api-v2';
import { env } from '#root/config';
import { container } from '@sapphire/framework';
import { Constants, MessageActionRow, MessageButton } from 'discord.js';
import { CustomId } from '#utils/constants';
import { stripIndents } from 'common-tags';

export class TwitterService {
	public readonly api = new TwitterApi({
		appKey: env.TWITTER_API_KEY,
		appSecret: env.TWITTER_API_KEY_SECRET,
		accessToken: env.TWITTER_ACCESS_TOKEN,
		accessSecret: env.TWITTER_ACCESS_TOKEN_SECRET
	}).v2.readWrite;

	public readonly client = new TwitterApi(env.TWITTER_BEARER_TOKEN).v2.readOnly;
	public stream!: TweetStream;

	public async init() {
		const rules = await this.client.streamRules();

		// If rules exist previously, delete them, to ensure a clean slate each time.
		if (rules?.data?.length) {
			await this.client.updateStreamRules({
				delete: { ids: rules.data.map((rule) => rule.id) }
			});
		}

		// This stream rule will match any tweet including the term "team jamp", using the #teamjamp hashtag, mentioning
		// @team_jamp. The conditions are case insensitive, and retweets, replies, quote retweets, and tweets from team_jamp itself will be ignored.
		await this.client.updateStreamRules({
			add: [{ value: `("team jamp" OR #teamjamp OR @team_jamp) -is:retweet -is:quote -is:reply -from:team_jamp` }]
		});

		this.stream = await this.client.searchStream({ 'tweet.fields': ['author_id'] });
		this.stream.autoReconnect = true;
		this.stream.on(ETwitterStreamEvent.Data, this.handleTweetData.bind(this));
	}

	public async handleTweetData({ data: tweet }: TweetV2SingleStreamResult) {
		const channel = container.client.channels.cache.get(env.TWITTER_NOTIFICATION_CHANNEL_ID);
		if (!channel?.isText()) {
			return this.stream.destroy();
		}

		const likeButton = new MessageButton()
			.setCustomId(CustomId.Like)
			.setEmoji('💖')
			.setLabel('Like')
			.setStyle(Constants.MessageButtonStyles.PRIMARY);

		const retweetButton = new MessageButton()
			.setCustomId(CustomId.Retweet)
			.setEmoji('🔁')
			.setLabel('Retweet')
			.setStyle(Constants.MessageButtonStyles.PRIMARY);

		const replyButton = new MessageButton()
			.setCustomId(CustomId.Reply)
			.setEmoji('💬')
			.setLabel('Reply')
			.setStyle(Constants.MessageButtonStyles.PRIMARY);

		const blockButton = new MessageButton()
			.setCustomId(CustomId.Block)
			.setEmoji('🤐')
			.setLabel('Block')
			.setStyle(Constants.MessageButtonStyles.PRIMARY);

		const row = new MessageActionRow().setComponents(likeButton, retweetButton, replyButton, blockButton);
		await channel.send({
			content: stripIndents`
				🔔 New tweet detected!
				${this.createTweetLink(tweet.author_id!, tweet.id)}
			`,
			components: [row]
		});
	}

	private createTweetLink(author: string, id: string) {
		return `https://twitter.com/${author}/status/${id}`;
	}

	public static canRun() {
		return Boolean(
			env.TWITTER_API_KEY &&
				env.TWITTER_API_KEY_SECRET &&
				env.TWITTER_ACCESS_TOKEN &&
				env.TWITTER_ACCESS_TOKEN_SECRET &&
				env.TWITTER_ACCOUNT_ID &&
				env.TWITTER_NOTIFICATION_CHANNEL_ID
		);
	}
}

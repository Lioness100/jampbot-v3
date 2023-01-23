import { env } from '#root/config';
import { ApplyOptions } from '@sapphire/decorators';
import { Listener, Events } from '@sapphire/framework';
import type { GuildMember } from 'discord.js';
import { submissionLocks } from '#root/database';

@ApplyOptions({ enabled: Boolean(env.SUBMISSION_LOCKED_ROLE_ID) })
export class GuildMemberRemoveListener extends Listener<typeof Events.GuildMemberRemove> {
	public async run(member: GuildMember) {
		if (submissionLocks.data.includes(member.id)) {
			return;
		}

		if (!member.roles.cache.has(env.SUBMISSION_LOCKED_ROLE_ID)) {
			return;
		}

		submissionLocks.data.push(member.id);
		await submissionLocks.write();
	}
}

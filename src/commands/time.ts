import { Command, from, isErr } from '@sapphire/framework';
import { createEmbed, sendError } from '#utils/responses';
import { getTimeZones, timeZonesNames } from '@vvo/tzdb';
import Fuse from 'fuse.js/dist/fuse.basic.min.js';
import { cutText } from '@sapphire/utilities';
import { AutoCompleteLimits } from '@sapphire/discord.js-utilities';

const timezones = getTimeZones();
const timeZoneDisplayOptions = { timeZoneName: 'long', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' } as const;

export class TimeCommand extends Command {
	public override chatInputRun(interaction: Command.ChatInputInteraction) {
		const timezone = interaction.options.getString('timezone', true);
		const time = from(() => new Date().toLocaleString(interaction.locale, { ...timeZoneDisplayOptions, timeZone: timezone }));

		if (isErr(time)) {
			return sendError(interaction, 'Invalid timezone');
		}

		const embed = createEmbed().setTitle(`⌚ It is ${time.value}`);
		return interaction.reply({ embeds: [embed] });
	}

	public override autocompleteRun(interaction: Command.AutocompleteInteraction) {
		const query = interaction.options.getFocused() as string;

		if (!query) {
			const names = timeZonesNames
				.sort(() => Math.random() - 0.5)
				.slice(0, 25)
				.map((name) => ({ name, value: name }));

			return interaction.respond(names);
		}

		const fuzzerSearcher = new Fuse(timezones, { keys: ['name', 'alternativeName', 'group', 'mainCities', 'abbreviation'] });
		const results = fuzzerSearcher.search(query.toLowerCase(), { limit: 25 });

		const options = results.map(({ item }) => ({
			name: cutText(`${item.name} (${item.currentTimeFormat})`, AutoCompleteLimits.MaximumLengthOfNameOfOption),
			value: item.name
		}));

		return interaction.respond(options);
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName('time')
				.setDescription('View the time in another zone!')
				.addStringOption((builder) =>
					builder //
						.setName('timezone')
						.setDescription('The timezone to convert to')
						.setAutocomplete(true)
						.setRequired(true)
				)
		);
	}
}

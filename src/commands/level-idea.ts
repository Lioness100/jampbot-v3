import { range, sample } from '#utils/common';
import { Command } from '#structures/Command';
import { commaListsAnd } from 'common-tags';
import { createEmbed } from '#utils/responses';
import { MessageButton, Constants, MessageActionRow } from 'discord.js';
import { Emoji } from '#utils/constants';
import { CustomId, createCustomId } from '#utils/customIds';

export class LevelIdeaCommand extends Command {
	public override chatInputRun(interaction: Command.Interaction) {
		const style = interaction.options.getNumber('style') ?? undefined;
		const embed = createEmbed(LevelIdeaCommand.generateIdea(style));

		const button = new MessageButton()
			.setCustomId(createCustomId(CustomId.LevelIdea, style))
			.setEmoji('🔁')
			.setLabel('Generate another idea')
			.setStyle(Constants.MessageButtonStyles.PRIMARY);

		const row = new MessageActionRow().setComponents(button);
		return interaction.reply({ embeds: [embed], components: [row] });
	}

	public static generateIdea(requiredStyleBit?: number) {
		const elementGroups = [this.getPowerups(), this.getEnemies(), this.getGizmos()] as const;
		const [powerups, enemies, gizmos] = elementGroups;

		let styleBit: undefined | number;
		let theme: undefined | typeof this.THEMES[number];

		if (requiredStyleBit || Math.random() > 0.6) {
			styleBit = requiredStyleBit || sample(Object.values(this.STYLES));
			this.filterElements(elementGroups, styleBit);
		}

		if (Math.random() > 0.8) {
			theme = sample(this.THEMES);
			if (theme === 'Ground') {
				powerups.delete('the Rotten Mushroom');
			}
		}

		const elements = Array.from({ length: range(1, 3) }, () => {
			const group: Map<string, number> = Math.random() > 0.8 ? powerups : Math.random() > 0.5 ? gizmos : enemies;
			const [element, styleBit] = sample([...group.entries()]);

			this.filterElements(elementGroups, styleBit);
			group.delete(element);

			return element;
		});

		const style = styleBit ? Object.entries(this.STYLES).find(([_, bit]) => bit === styleBit)![0] : null;
		const segments = [
			style,
			theme && `${Math.random() <= 0.2 ? 'Night ' : ''}${theme}`,
			'Jamp level',
			elements.length ? commaListsAnd`with ${elements}` : ''
		].filter(Boolean);

		const article = `a${['U', 'A'].includes(segments[0]![0]) ? 'n' : ''}`;
		return `You should create ${article} ${segments.join(' ')} ${Emoji.PridePog}`;
	}

	private static filterElements(elementGroups: readonly Map<string, number>[], styleBit: number) {
		for (const elements of elementGroups) {
			for (const [element, requiredStyleBit] of elements) {
				const sharesStyles = (styleBit & requiredStyleBit) !== 0;
				if (!sharesStyles) {
					elements.delete(element);
				}
			}
		}
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((command) =>
			command
				.setName('level-idea')
				.setDescription('Generate an idea for your next level!')
				.addNumberOption((option) =>
					option //
						.setName('style')
						.setDescription('The style you specifically want your level to be, if any')
						.setChoices(...Object.entries(LevelIdeaCommand.STYLES).map(([name, bit]) => ({ name, value: bit })))
						.setRequired(false)
				)
		);
	}

	private static readonly STYLES = { SMB1: 1, SMB3: 1 << 1, SMW: 1 << 2, NSMBU: 1 << 3, '3DW': 1 << 4 };
	private static readonly ALL_STYLES = this.STYLES['SMB1'] | this.STYLES['SMB3'] | this.STYLES['SMW'] | this.STYLES['NSMBU'] | this.STYLES['3DW'];
	private static readonly THEMES = ['Ground', 'Underground', 'Ghost House', 'Airship', 'Castle', 'Desert', 'Snow', 'Forest', 'Sky'] as const;

	private static getGizmos() {
		return new Map([
			['burners', this.ALL_STYLES ^ this.STYLES['3DW']],
			['cannons', this.ALL_STYLES ^ this.STYLES['3DW']],
			['vines', this.ALL_STYLES ^ this.STYLES['3DW']],
			['lifts', this.ALL_STYLES ^ this.STYLES['3DW']],
			['flimsy lifts', this.ALL_STYLES ^ this.STYLES['3DW']],
			['lava lifts', this.ALL_STYLES ^ this.STYLES['3DW']],
			['fast lava lifts', this.ALL_STYLES ^ this.STYLES['3DW']],
			['seesaws', this.ALL_STYLES ^ this.STYLES['3DW']],
			['grinders', this.ALL_STYLES ^ this.STYLES['3DW']],
			['bumpers', this.ALL_STYLES ^ this.STYLES['3DW']],
			['swinging claws', this.ALL_STYLES ^ this.STYLES['3DW']],
			['skewers', this.ALL_STYLES ^ this.STYLES['3DW']],
			['fire bars', this.ALL_STYLES ^ this.STYLES['3DW']],
			['conveyor belts', this.ALL_STYLES],
			['ON/OFF switches', this.ALL_STYLES],
			['dotted-line blocks', this.ALL_STYLES],
			['snake blocks', this.ALL_STYLES],
			['P blocks', this.ALL_STYLES],
			['P switches', this.ALL_STYLES],
			['POW blocks', this.ALL_STYLES],
			['springs', this.ALL_STYLES],
			['icicles', this.ALL_STYLES],
			['twisters', this.ALL_STYLES],
			['bill blasters', this.ALL_STYLES],
			['banzai bills', this.ALL_STYLES],
			['a cursed key', this.STYLES['SMB1']],
			['crates', this.STYLES['3DW']],
			['! blocks', this.STYLES['3DW']],
			['blinking blocks', this.STYLES['3DW']],
			['track blocks', this.STYLES['3DW']],
			['trees', this.STYLES['3DW']],
			['ON/OFF trampolines', this.STYLES['3DW']],
			['mushroom trampolines', this.STYLES['3DW']],
			['dash blocks', this.STYLES['3DW']],
			['spike blocks', this.STYLES['3DW']],
			['cloud lifts', this.STYLES['3DW']],
			['red POW blocks', this.STYLES['3DW']],
			['note blocks', this.STYLES['3DW']],
			['donut blocks', this.ALL_STYLES],
			['hidden blocks', this.ALL_STYLES],
			['? blocks', this.ALL_STYLES],
			['spikes', this.STYLES['3DW']],
			['clear pipes', this.STYLES['3DW']]
		] as const);
	}

	private static getPowerups() {
		return new Map([
			['the Super Mushroom', this.ALL_STYLES],
			['the Master Sword', this.STYLES['SMB1']],
			['the Fire Flower', this.ALL_STYLES],
			['the Superball Flower', this.STYLES['SMB1']],
			['the Big Mushroom', this.STYLES['SMB1']],
			['the Super Leaf', this.STYLES['SMB3']],
			['the Cape Feather', this.STYLES['SMW']],
			['the Propeller Mushroom', this.STYLES['NSMBU']],
			['the Super Bell', this.STYLES['3DW']],
			['the Super Hammer', this.STYLES['3DW']],
			['the SMB Mushroom', this.STYLES['SMB1']],
			['the Frog Suit', this.STYLES['SMB3']],
			['the Power Balloon', this.STYLES['SMW']],
			['the Super Acorn', this.STYLES['NSMBU']],
			['the Boomerang Flower', this.STYLES['3DW']],
			['the Super Star', this.ALL_STYLES],
			['the Rotten Mushroom', this.ALL_STYLES ^ this.STYLES['3DW']],
			['the Shoe Goomba', this.STYLES['SMB1'] | this.STYLES['SMB3']],
			["Yoshi's Egg", this.STYLES['SMW'] | this.STYLES['NSMBU']],
			['the Cannon Box', this.STYLES['3DW']],
			['the Propeller Box', this.STYLES['3DW']],
			['the Goomba Mask', this.STYLES['3DW']],
			['the Bullet Bill Mask', this.STYLES['3DW']],
			['the Red POW Box', this.STYLES['3DW']]
		] as const);
	}

	private static getEnemies() {
		return new Map([
			['Koopa Troopas', this.ALL_STYLES],
			['Buzzy Beetles', this.ALL_STYLES ^ this.STYLES['3DW']],
			['Buzzy Shells', this.ALL_STYLES ^ this.STYLES['3DW']],
			['Spike Tops', this.ALL_STYLES ^ this.STYLES['3DW']],
			['Ant Troopers', this.STYLES['3DW']],
			['Spinies', this.ALL_STYLES],
			['Spiny Shells', this.ALL_STYLES ^ this.STYLES['3DW']],
			['Bloopers', this.ALL_STYLES ^ this.STYLES['3DW']],
			['Cheep Cheeps', this.ALL_STYLES],
			['Skipsqueaks', this.STYLES['3DW']],
			['Stingbies', this.STYLES['3DW']],
			['Piranha Plants', this.ALL_STYLES],
			['Munchers', this.ALL_STYLES ^ this.STYLES['3DW']],
			['Piranha Creepers', this.STYLES['3DW']],
			['Thwomps', this.ALL_STYLES],
			['Monty Moles', this.ALL_STYLES ^ this.STYLES['3DW']],
			['Rocky Wrenches', this.ALL_STYLES ^ this.STYLES['3DW']],
			['Chain Chomps', this.ALL_STYLES ^ this.STYLES['3DW']],
			['Unchained Chomps', this.ALL_STYLES ^ this.STYLES['3DW']],
			['Hop-Chops', this.STYLES['3DW']],
			['Snowballs', this.ALL_STYLES],
			['Wigglers', this.ALL_STYLES ^ this.STYLES['3DW']],
			['Boos', this.ALL_STYLES],
			['Lava Bubbles', this.ALL_STYLES],
			['Bob-ombs', this.ALL_STYLES],
			['Dry Bones', this.ALL_STYLES],
			['Dry Bone Shells', this.ALL_STYLES ^ this.STYLES['3DW']],
			['Fish Bones', this.ALL_STYLES],
			['Magikoopas', this.ALL_STYLES],
			['Pokeys', this.ALL_STYLES],
			['Bowser', this.ALL_STYLES],
			['Bowser Jr.', this.ALL_STYLES ^ this.STYLES['3DW']],
			['Boom Boom/Pom Pom', this.ALL_STYLES],
			['Mechakoopas', this.ALL_STYLES ^ this.STYLES['3DW']],
			['Angry Sun', this.ALL_STYLES ^ this.STYLES['3DW']],
			["Lakitu/Lakitu's cloud", this.ALL_STYLES ^ this.STYLES['3DW']],
			['Charvaarghs', this.STYLES['3DW']],
			['Bullies', this.STYLES['3DW']],
			['Porcupuffers', this.STYLES['3DW']],
			['Clown Cars', this.ALL_STYLES ^ this.STYLES['3DW']],
			['Koopa Troopa Cars', this.STYLES['3DW']],
			['Larry', this.ALL_STYLES ^ this.STYLES['3DW']],
			['Iggy', this.ALL_STYLES ^ this.STYLES['3DW']],
			['Wendy', this.ALL_STYLES ^ this.STYLES['3DW']],
			['Lemmy', this.ALL_STYLES ^ this.STYLES['3DW']],
			['Roy', this.ALL_STYLES ^ this.STYLES['3DW']],
			['Morton', this.ALL_STYLES ^ this.STYLES['3DW']],
			['Ludwig', this.ALL_STYLES ^ this.STYLES['3DW']]
		] as const);
	}
}

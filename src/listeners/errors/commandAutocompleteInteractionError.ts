import { Listener, type Events, type AutocompleteInteractionPayload } from '@sapphire/framework';
import { bold, redBright } from 'colorette';

export class InteractionHandlerErrorListener extends Listener<typeof Events.CommandAutocompleteInteractionError> {
	public run(error: Error, { command }: AutocompleteInteractionPayload) {
		this.container.logger.fatal(`${redBright(bold(`[/${command.name}]`))} ${error.stack || error.message}`);
	}
}

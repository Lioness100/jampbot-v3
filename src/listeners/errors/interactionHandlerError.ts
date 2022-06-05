import { Listener, type Events, type InteractionHandlerError } from '@sapphire/framework';
import { bold, redBright } from 'colorette';

export class InteractionHandlerErrorListener extends Listener<typeof Events.InteractionHandlerError> {
	public run(error: Error, { handler }: InteractionHandlerError) {
		this.container.logger.fatal(`${redBright(bold(`[${handler.name}]`))} ${error.stack || error.message}`);
	}
}

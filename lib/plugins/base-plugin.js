/**
 * @typedef {import('../telegram-commander.js').default} TelegramCommander
 */

export default class TelegramCommanderPlugin {
	/** @type {TelegramCommander} */				bot = undefined

	init(bot) {
		this.bot = bot
		// TODO: change to async
		// TODO: add init() to TelegramCommander to check if all plugins are initialized
		// TODO: check for duplicated instances of the same plugin
	}
}
/**
 * @typedef {import('../telegram-commander.js').default} TelegramCommander
 */


export default class TelegramCommanderPlugin {
	/** @type {TelegramCommander} */				bot = undefined

	init(bot) {
		this.bot = bot
	}
}
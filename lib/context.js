/**
 * @typedef {import('node-telegram-bot-api').SendMessageOptions} SendMessageOptions
 * @typedef {import('node-telegram-bot-api').Message} Message
 * @typedef {import('./telegram-cli-bot').default} TelegramCliBot
 * @typedef {import('./types.js').Command} Command
 */

export default class Context {
	/** @type {TelegramCliBot} */					bot = undefined
	/** @type {Command} */							command = undefined
	/** @type {Message} */							msg = undefined
	/** @type {(Message) => void} */				messageResolve = undefined
	/** @type {Context|undefined} */				prevContext = undefined  // If the command is called while another command is running, this will be set to the previous context.

	/**
	 * @param {TelegramCliBot} bot
	 * @param {Command} commandName
	 * @param {Message} msg
	 * @param {string[]} [args]
	 */
	constructor(bot, command, msg, args = []) {
		this.bot = bot
		this.command = command
		this.msg = msg
		this.args = args ?? []
	}

	/**
	 * @param {string|string[]} content
	 * @param {SendMessageOptions} [opts={}]
	 * @returns {Promise<Message>}
	 */
	async reply(content, opts = {}) {
		return this.bot.sendMessage(this.msg.chat.id, content, opts)[0]
	}

	/**
	 * Wait for a message from the same user in the same chat.
	 * CAUTION: to read message from groups, talk to \@BotFather and disable privacy mode.
	 * @see https://core.telegram.org/bots#privacy-mode
	 *
	 * @returns {Promise<Message>}
	 */
	async waitForMessage() {
		if (this.messageResolve) {
			throw new Error('Already waiting for message. Are you calling waitForMessage() twice?')
		}
		const msg = await new Promise(resolve => this.messageResolve = resolve)
		this.messageResolve = undefined
		return msg
	}
}
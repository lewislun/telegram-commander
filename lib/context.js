import * as types from './types.js'

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
	/** @type {Context|undefined} */				prevContext = undefined  // If the command is called while another command is running, this will be set to the previous context.
	/** @private @type {(Message) => void} */		messageResolve = undefined
	/** @private @type {(Error) => void} */			messageReject = undefined

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
	 * @returns {boolean}
	 */
	get isWaitingForMessage() {
		return !!this.messageResolve
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

		try {
			const promise = new Promise((resolve, reject) => {
				this.messageResolve = resolve
				this.messageReject = reject
			})
			const msg = await promise  // separating promise and await to ensure that there is no possible race condition
			this.messageResolve = undefined
			this.messageReject = undefined
			return msg

		} catch (err) {
			this.messageResolve = undefined
			this.messageReject = undefined
			throw err
		}
	}

	/**
	 * Receive message from the same user in the same chat. This is called by TelegramCliBot.
	 * @param {Message} msg
	 * @throws {Error} if not waiting for message
	 */
	receiveMessage(msg) {
		if (!this.messageResolve) {
			throw new Error('Not waiting for message. Are you calling receiveMessage() without calling waitForMessage()?')
		}
		this.messageResolve(msg)
	}

	/**
	 * Cancel the context. This is called by TelegramCliBot.
	 */
	cancel() {
		if (this.messageReject) {
			this.messageReject(new types.ContextCancelError())
		}
	}
}
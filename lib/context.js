import * as types from './types.js'

/**
 * @typedef {import('node-telegram-bot-api').SendMessageOptions} SendMessageOptions
 * @typedef {import('node-telegram-bot-api').Message} Message
 * @typedef {import('node-telegram-bot-api').CallbackQuery} CallbackQuery
 * @typedef {import('./telegram-commander.js').default} TelegramCommander
 * @typedef {import('./types.js').Command} Command
 */

export default class Context {
	/** @type {TelegramCommander} */				bot = undefined
	/** @type {Command} */							command = undefined
	/** @type {Message} */							msg = undefined
	/** @type {Context|undefined} */				prevContext = undefined  // If the command is called while another command is running, this will be set to the previous context.
	/** @private @type {(Error) => void} */			messageReject = undefined
	/** @private @type {(Error) => void} */			callbackQueryReject = undefined

	/**
	 * @param {TelegramCommander} bot
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
		const msgs = await this.bot.sendMessage(this.msg.chat.id, content, opts)
		return msgs[0]
	}

	/**
	 * Wait for a message from the same user in the same chat.
	 * CAUTION: to read message from groups, talk to \@BotFather and disable privacy mode.
	 * @see https://core.telegram.org/bots#privacy-mode
	 * @returns {Promise<Message>}
	 */
	async waitForMessage() {
		// TODO: opts
		let /** @type {Message} */ msg
		let /** @type {Error} */ err
		let /** @type {types.MessageListener} */ listener
		try {
			msg = await new Promise((resolve, reject) => {
				listener = this.bot.replyListenerRegistry.registerMsgListener(this.msg.chat.id, 1, this.msg.from.id, resolve)
				this.messageReject = reject
			})

		} catch (e) {
			err = e
		}
		this.messageReject = undefined

		if (err) {
			// unregister listener
			if (listener) {
				this.bot.replyListenerRegistry.unregisterListener(listener.id)
			}
			throw err
		}
		return msg
	}

	/**
	 * Wait for callback query (a.k.a. inline keyboard button click).
	 * @see https://core.telegram.org/bots/api#callbackquery
	 * @param {Message} inlineKeyboardMsg The message that contains the inline keyboard.
	 * @param {types.WaitForCallbackQueryOnceOptions} [opts={}]
	 */
	async waitForCallbackQueryOnce(inlineKeyboardMsg, opts = {}) {
		const originalCallerOnly = opts?.originalCallerOnly ?? true
		const closeKeyboardOnDone = opts?.closeKeyboardOnDone ?? true
		const autoBlankAnswer = opts?.autoBlankAnswer ?? true

		let /** @type {CallbackQuery} */ query
		let /** @type {Error} */ err
		let /** @type {types.CallbackQueryListener} */ listener
		try {
			query = await new Promise((resolve, reject) => {
				listener = this.bot.replyListenerRegistry.registerCallbackQueryListener(inlineKeyboardMsg, 1, originalCallerOnly? this.msg.from.id : undefined, resolve)
				this.callbackQueryReject = reject
			})
			autoBlankAnswer && this.bot.answerCallbackQuery(query.id, {})

		} catch (e) {
			// unregister listener
			if (listener) {
				this.bot.replyListenerRegistry.unregisterListener(listener.id)
			}
			err = e
		}
		this.callbackQueryReject = undefined
		closeKeyboardOnDone && this.bot.editMessageReplyMarkup({}, { chat_id: inlineKeyboardMsg.chat.id, message_id: inlineKeyboardMsg.message_id })

		if (err) {
			throw err
		}
		return query
	}

	/**
	 * Cancel the context.
	 */
	cancel() {
		if (this.messageReject) {
			this.messageReject(new types.ContextCancelError())
		}
		if (this.callbackQueryReject) {
			this.callbackQueryReject(new types.ContextCancelError())
		}
	}
}
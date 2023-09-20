import * as types from './types.js'

/**
 * @typedef {import('node-telegram-bot-api').SendMessageOptions} SendMessageOptions
 * @typedef {import('node-telegram-bot-api').Message} Message
 * @typedef {import('node-telegram-bot-api').CallbackQuery} CallbackQuery
 * @typedef {import('./telegram-commander.js').default} TelegramCommander
 * @typedef {import('./types.js').Command} Command
 */

let nextContextId = 1

export default class Context {
	/** @readonly @type {number} */					id = nextContextId++
	/** @type {types.ContextType} */				type = types.ContextType.LINEAR
	/** @type {TelegramCommander} */				bot = undefined
	/** @type {number} */							chatId = undefined
	/** @type {Command} */							command = undefined  // The command called. Undefined for bot triggered conversation.
	/** @type {Message} */							triggerMsg = undefined  // The message that triggered the conversation. For a command call, this should be the message containing the command.
	/** @type {number} */							targetUserId = undefined  // If set, only replies from this user will be handled. Has no effect for direct message.
	/** @type {string[]} */							args = undefined  // The arguments passed to the command. Undefined for bot triggered conversation.
	/** @type {Context|undefined} */				prevContext = undefined  // If the command is called while another command is running, this will be set to the previous context.
	/** @private @type {(Error) => void} */			messageReject = undefined
	/** @private @type {(Error) => void} */			callbackQueryReject = undefined

	/**
	 * @param {TelegramCommander} bot
	 * @param {Command} command
	 * @param {Message} msg
	 * @param {string[]} [args]
	 * @returns {Context}
	 */
	static fromCommand(bot, command, msg, args) {
		const context = new Context(bot, msg.chat.id, {
			type: command.contextType,
			targetUserId: command.groupMode? undefined : msg.from.id,
		})
		context.command = command
		context.triggerMsg = msg
		context.args = args ?? []
		return context
	}

	/**
	 * @param {TelegramCommander} bot
	 * @param {number} chatId
	 * @param {object} [opts={}]
	 * @param {types.ContextType} [opts.type='linear']
	 * @param {number} [opts.targetUserId]
	 */
	constructor(bot, chatId, opts = {}) {
		this.bot = bot
		this.chatId = chatId
		this.type = opts?.type ?? this.type
		this.targetUserId = opts?.targetUserId ?? this.targetUserId
	}

	get conversationId() {
		return `${this.chatId}:${this.targetUserId ?? 'group'}`
	}

	/**
	 * @param {string|string[]} content
	 * @param {SendMessageOptions} [opts={}]
	 * @returns {Promise<Message>}
	 */
	async reply(content, opts = {}) {
		const msgs = await this.bot.sendMessage(this.chatId, content, opts)
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
				listener = this.bot.replyListenerRegistry.registerMsgListener(this.chatId, 1, this.targetUserId, resolve)
				this.messageReject = reject
			})

		} catch (e) {
			// unregister listener
			if (listener) {
				this.bot.replyListenerRegistry.unregisterListener(listener.id)
			}
			err = e
		}
		this.messageReject = undefined

		if (err) {
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
		const closeKeyboardOnDone = opts?.closeKeyboardOnDone ?? true
		const autoBlankAnswer = opts?.autoBlankAnswer ?? true

		let /** @type {CallbackQuery} */ query
		let /** @type {Error} */ err
		let /** @type {types.CallbackQueryListener} */ listener
		try {
			query = await new Promise((resolve, reject) => {
				listener = this.bot.replyListenerRegistry.registerCallbackQueryListener(inlineKeyboardMsg, 1, this.targetUserId, resolve)
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
import * as types from './types.js'
import { escapeMarkdownV2 as e } from './utils.js'

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
	/** @type {TelegramCommander} */				commander = undefined
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

	static getConversationId(chatId, targetUserId) {
		return `${chatId}:${targetUserId ?? 'group'}`
	}

	/**
	 * @param {TelegramCommander} bot
	 * @param {number} chatId
	 * @param {object} [opts={}]
	 * @param {types.ContextType} [opts.type='linear']
	 * @param {number} [opts.targetUserId]
	 */
	constructor(bot, chatId, opts = {}) {
		this.commander = bot
		this.chatId = chatId
		this.type = opts?.type ?? this.type
		this.targetUserId = opts?.targetUserId ?? this.targetUserId
	}

	get conversationId() {
		return Context.getConversationId(this.chatId, this.targetUserId)
	}

	/**
	 * @param {string|string[]} content
	 * @param {SendMessageOptions} [opts={}]
	 * @returns {Promise<Message>}
	 */
	async reply(content, opts = {}) {
		const msgs = await this.commander.sendMessage(this.chatId, content, opts)
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
				listener = this.commander.replyListenerRegistry.registerMsgListener(this.chatId, 1, this.targetUserId, resolve)
				this.messageReject = reject
			})

		} catch (e) {
			// unregister listener
			if (listener) {
				this.commander.replyListenerRegistry.unregisterListener(listener.id)
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
				listener = this.commander.replyListenerRegistry.registerCallbackQueryListener(inlineKeyboardMsg, 1, this.targetUserId, resolve)
				this.callbackQueryReject = reject
			})
			autoBlankAnswer && this.commander.bot.answerCallbackQuery(query.id, {})

		} catch (e) {
			// unregister listener
			if (listener) {
				this.commander.replyListenerRegistry.unregisterListener(listener.id)
			}
			err = e
		}
		this.callbackQueryReject = undefined
		closeKeyboardOnDone && this.commander.bot.editMessageReplyMarkup({}, { chat_id: inlineKeyboardMsg.chat.id, message_id: inlineKeyboardMsg.message_id })

		if (err) {
			throw err
		}
		return query
	}

	/**
	 * Prompt the user for a text input. This is basically a wrapper around waitForMessage() and reply().
	 * @param {string|string[]} content
	 * @param {SendMessageOptions & { errorMsg?: string }} [opts={}]
	 * @returns {Promise<Message>}
	 */
	async promptText(content, opts = {}) {
		const errorMsg = opts?.errorMsg ?? e('Please enter a valid text.')
		let result = undefined
		do {
			await this.reply(content, opts)
			const msg = await this.waitForMessage()
			result = msg.text
			if (!result) {
				await this.reply(errorMsg, opts)
			}
		} while (!result)
		return result
	}

	/**
	 * Prompt the user for a text input. This is basically a wrapper around waitForMessage() and reply().
	 * @param {string|string[]} content
	 * @param {string[]} enumValues
	 * @param {SendMessageOptions & { errorMsg?: string }} [opts={}]
	 * @returns {Promise<string>}
	 */
	async promptEnum(content, enumValues, opts = {}) {
		const errorMsg = opts?.errorMsg ?? e(`Please enter one of the following values: ${enumValues.join(', ')}`)
		let result = undefined
		do {
			await this.reply(content, opts)
			const msg = await this.waitForMessage()
			result = msg.text
			if (!enumValues.includes(result)) {
				await this.reply(errorMsg, opts)
			}
		} while (!enumValues.includes(result))
		return result
	}

	/**
	 * Prompt the user for a number input. This is basically a wrapper around waitForMessage() and reply().
	 * @param {string|string[]} content
	 * @param {SendMessageOptions & { errorMsg?: string, min?: number, max?: number }} [opts={}]
	 * @returns {Promise<number>}
	 */
	async promptNumber(content, opts = {}) {
		const errorMsg = opts?.errorMsg ?? e('Please enter a valid number.')
		const min = opts?.min ?? undefined
		const max = opts?.max ?? undefined
		let result = undefined
		do {
			await this.reply(content, opts)
			const msg = await this.waitForMessage()
			result = Number(msg.text)
			if (isNaN(result)) {
				await this.reply(errorMsg, opts)
			} else if (min !== undefined && result < min) {
				await this.reply(errorMsg, opts)
			} else if (max !== undefined && result > max) {
				await this.reply(errorMsg, opts)
			}
		} while (isNaN(result) || (min !== undefined && result < min) || (max !== undefined && result > max))
		return result
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
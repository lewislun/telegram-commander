import * as types from './types.js'
import { escapeMarkdownV2 as e } from './utils.js'

/**
 * @typedef {import('node-telegram-bot-api').SendMessageOptions} SendMessageOptions
 * @typedef {import('node-telegram-bot-api').Message} Message
 * @typedef {import('node-telegram-bot-api').CallbackQuery} CallbackQuery
 * @typedef {import('./telegram-commander.js').default} TelegramCommander
 * @typedef {import('./types.js').Command} Command
 * 
 * @typedef {Object} PromptOptions
 * @property {string|((result: string) => string)} [errorMsg]
 * @property {(result: string) => boolean} [validator]
 * @property {(result: string) => string} [promptTextOnDone] If defined, the prompt text will change to this text after the user has entered a valid input.
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
	 * @returns {Promise<CallbackQuery>}
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
	 * Prompt the user for a text input. It accepts both inline keyboard or text input, which ever comes first.
	 * This is a wrapper around reply(), waitForMessage() and waitForCallbackQueryOnce().
	 * @param {string|string[]} content
	 * @param {SendMessageOptions & PromptOptions} [opts={}]
	 * @returns {Promise<string>}
	 */
	async prompt(content, opts = {}) {
		let errorMsgFunc = opts?.errorMsg
		if (typeof errorMsgFunc !== 'function') {
			errorMsgFunc = () => opts?.errorMsg ?? e('Please enter a valid input.')
		}
		const validator = opts?.validator ?? ((result) => !!result)
		const promptMsg = await this.reply(content, opts)
		let result = undefined
		do {
			const msgOrQuery = await Promise.race([this.waitForMessage(), this.waitForCallbackQueryOnce(promptMsg)])
			result = msgOrQuery?.text ?? msgOrQuery?.data
			if (!validator(result)) {
				await this.reply(errorMsgFunc(result))
			}
		} while (!validator(result))

		if (opts?.promptTextOnDone) {
			const newPromptText = opts.promptTextOnDone(result)
			await this.commander.bot.editMessageText(newPromptText, {
				chat_id: this.chatId,
				message_id: promptMsg.message_id,
			})
		}

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
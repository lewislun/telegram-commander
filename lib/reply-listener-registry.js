import * as types from './types.js'

/**
 * @typedef {import('node-telegram-bot-api').Message} Message
 * @typedef {import('node-telegram-bot-api').CallbackQuery} CallbackQuery
 */

export default class ReplyListenerRegistry {

	/** @type {number} */														nextListenerId = 1
	/** @type {Map.<string, Map<number, types.CallbackQueryListener>>} */		queryListenerByIdByMsgIdentifier = new Map()
	/** @type {Map.<number, string>} */											msgIdentifierByQueryListenerId = new Map()
	/** @type {Map.<number, Map<number, types.MessageListener>>} */				msgListenerByIdByChatId = new Map()
	/** @type {Map.<number, number>} */ 										chatIdByMsgListenerId = new Map()

	/**
	 * A unique identifier for a message.
	 * 
	 * @private
	 * @param {Message} msg
	 * @returns {string}
	 */
	getMsgIdentifier(msg) {
		return `${msg.chat.id}:${msg.message_id}`
	}

	/**
	 * @param {number} chatId
	 * @param {number} count
	 * @param {number} [targetUserId=undefined] If defined, only the user with this id can trigger the listener.
	 * @param {(msg: Message) => Promise<void>} handler
	 * @returns {types.MessageListener}
	 */
	registerMsgListener(chatId, count, targetUserId = undefined, handler) {
		if (!this.msgListenerByIdByChatId.has(chatId)) {
			this.msgListenerByIdByChatId.set(chatId, new Map())
		}
		const msgListenerById = this.msgListenerByIdByChatId.get(chatId)
		const listenerId = this.nextListenerId++
		/** @type {types.MessageListener} */
		const listener = {
			id: listenerId,
			chatId: chatId,
			maxCount: count,
			listenedCount: 0,
			targetUserId: targetUserId,
			handler: handler,
		}
		msgListenerById.set(listenerId, listener)
		this.chatIdByMsgListenerId.set(listenerId, chatId)
		return listener
	}

	/**
	 * @param {Message} inlineKeyboardMsg
	 * @param {number} count
	 * @param {number} [targetUserId=undefined] If defined, only the user with this id can trigger the listener.
	 * @param {(query: CallbackQuery) => Promise<void>} handler
	 * @returns {types.CallbackQueryListener}
	 */
	registerCallbackQueryListener(inlineKeyboardMsg, count, targetUserId = undefined, handler) {
		const msgId = this.getMsgIdentifier(inlineKeyboardMsg)
		if (!this.queryListenerByIdByMsgIdentifier.has(msgId)) {
			this.queryListenerByIdByMsgIdentifier.set(msgId, new Map())
		}
		const listenerId = this.nextListenerId++
		const queryListenerById = this.queryListenerByIdByMsgIdentifier.get(msgId)
		/** @type {types.CallbackQueryListener} */ 
		const listener = {
			id: listenerId,
			msgIdentifier: msgId,
			maxCount: count,
			listenedCount: 0,
			targetUserId: targetUserId,
			handler: handler,
		}
		queryListenerById.set(listenerId, listener)
		this.msgIdentifierByQueryListenerId.set(listenerId, msgId)
		return listener
	}

	/**
	 * @param {number} listenerId
	 * @returns {boolean}
	 */
	unregisterListener(listenerId) {
		const msgId = this.msgIdentifierByQueryListenerId.get(listenerId)
		const chatId = this.chatIdByMsgListenerId.get(listenerId)

		if (msgId) {
			// unregister callback query listener
			const queryListenerById = this.queryListenerByIdByMsgIdentifier.get(msgId)
			if (!queryListenerById) {
				return false
			}
			this.msgIdentifierByQueryListenerId.delete(listenerId)
			return queryListenerById.delete(listenerId)
		} else if (chatId) {
			// unregister message listener
			const msgListenerById = this.msgListenerByIdByChatId.get(chatId)
			if (!msgListenerById) {
				return false
			}
			this.chatIdByMsgListenerId.delete(listenerId)
			return msgListenerById.delete(listenerId)
		}

		return false
	}

	/**
	 * @param {CallbackQuery} query
	 */
	async handleCallbackQuery(query) {
		const msgId = this.getMsgIdentifier(query.message)
		if (!this.queryListenerByIdByMsgIdentifier.has(msgId)) {
			return
		}
		const queryListenerById = this.queryListenerByIdByMsgIdentifier.get(msgId)
		queryListenerById.forEach(queryListener => {
			if (queryListener.cmdCallerId && query.from.id !== queryListener.cmdCallerId) {
				return
			}
			queryListener.listenedCount++
			queryListener.handler(query)
			if ((queryListener.maxCount ?? Infinity) <= queryListener.listenedCount) {
				this.unregisterListener(queryListener.id)
				if (queryListenerById.size === 0) {
					this.queryListenerByIdByMsgIdentifier.delete(msgId)
				}
			}
		})
	}

	/**
	 * @param {Message} msg
	 */
	async handleMessage(msg) {
		const chatId = msg.chat.id
		if (!this.msgListenerByIdByChatId.has(chatId)) {
			return
		}
		const msgListenerById = this.msgListenerByIdByChatId.get(chatId)
		msgListenerById.forEach(msgListener => {
			if (msgListener.targetUserId && msg.from?.id !== msgListener.targetUserId) {
				return
			}
			msgListener.listenedCount++
			msgListener.handler(msg)
			if ((msgListener.maxCount ?? Infinity) <= msgListener.listenedCount) {
				this.unregisterListener(msgListener.id)
				if (msgListenerById.size === 0) {
					this.msgListenerByIdByChatId.delete(chatId)
				}
			}
		})
	}
}
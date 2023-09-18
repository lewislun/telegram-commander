import * as types from './types.js'

/**
 * @typedef {import('node-telegram-bot-api').Message} Message
 * @typedef {import('node-telegram-bot-api').CallbackQuery} CallbackQuery
 */

export default class ReplyListenerRegistry {

	/** @type {Map.<string, Map<number, types.CallbackQueryListener>>} */		queryListenerByIdByMsgIdentifier = new Map()
	/** @type {Map.<number, string>} */											msgIdentifierByQueryListenerId = new Map()
	/** @type {number} */														nextListenerId = 0

	/**
	 * @private
	 * @param {Message} msg
	 * @returns {string}
	 */
	getMsgIdentifier(msg) {
		return `${msg.chat.id}:${msg.message_id}`
	}

	/**
	 * 
	 * @param {Message} inlineKeyboardMsg
	 * @param {number} count
	 * @param {number} [cmdCallerId=undefined]
	 * @param {(CallbackQuery) => Promise<types.CallbackQueryListener>} handler
	 * @returns {types.CallbackQueryListener}
	 */
	registerCallbackQueryListener(inlineKeyboardMsg, count, cmdCallerId = undefined, handler) {
		const msgId = this.getMsgIdentifier(inlineKeyboardMsg)
		if (!this.queryListenerByIdByMsgIdentifier.has(msgId)) {
			this.queryListenerByIdByMsgIdentifier.set(msgId, new Map())
		}
		const listenerId = this.nextListenerId++
		const queryListenerById = this.queryListenerByIdByMsgIdentifier.get(msgId)
		const listener = {
			id: listenerId,
			msgIdentifier: msgId,
			maxCount: count,
			listenedCount: 0,
			cmdCallerId: cmdCallerId,
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
	unregisterCallbackQueryListener(listenerId) {
		const msgId = this.msgIdentifierByQueryListenerId.get(listenerId)
		if (!msgId) {
			return false
		}
		const queryListenerById = this.queryListenerByIdByMsgIdentifier.get(msgId)
		if (!queryListenerById) {
			return false
		}
		return queryListenerById.delete(listenerId)
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
			if (queryListener.maxCount > 0 && queryListener.listenedCount >= queryListener.maxCount) {
				return
			}
			queryListener.listenedCount++
			queryListener.handler(query)
			if (queryListener.maxCount ?? Infinity <= queryListener.listenedCount) {
				this.unregisterCallbackQueryListener(queryListener.id)
				if (queryListenerById.size === 0) {
					this.queryListenerByIdByMsgIdentifier.delete(msgId)
				}
			}
		})
	}
}
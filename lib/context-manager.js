import Context from './context.js'
import * as types from './types.js'

/**
 * @typedef {import('node-telegram-bot-api').Message} Message
 * @typedef {import('./telegram-commander.js').default} TelegramCommander
 */

export default class ContextManager {
	/** @type {Map<string, Map<number, Context>>} */		contextByIdByConvId = new Map()

	/**
	 * @private
	 * @param {Message} msg
	 * @returns {string}
	 */
	getConversationId(msg) {
		return `${msg.chat.id}:${msg.from?.id}`
	}

	/**
	 * @param {Message} msg
	 * @returns {Map<number, Context>|undefined}
	 */
	get(msg) {
		const key = this.getConversationId(msg)
		return this.contextByIdByConvId.get(key)
	}

	/**
	 * @param {Context} context
	 */
	set(context) {
		const convId = this.getConversationId(context.msg)
		const prevContextById = this.contextByIdByConvId.get(convId)
		if (prevContextById) {
			context.prevContexts = [ ...prevContextById.values() ]
			this.delete(context.msg)
		}
		const contextById = new Map()
		contextById.set(context.id, context)
		this.contextByIdByConvId.set(convId, contextById)
	}

	/**
	 * @param {Message|Context} msgOrContext
	 */
	delete(msgOrContext) {
		// delete a single context
		if (msgOrContext instanceof Context) {
			const convId = this.getConversationId(msgOrContext.msg)
			const contextById = this.contextByIdByConvId.get(convId)
			if (contextById) {
				const context = contextById.get(msgOrContext.id)
				if (context) {
					context.cancel()
					contextById.delete(msgOrContext.id)
					if (contextById.size === 0) {
						this.contextByIdByConvId.delete(convId)
					}
				}
			}

		// delete all contexts with the same conversation id
		} else {
			const convId = this.getConversationId(msgOrContext)
			const contextById = this.contextByIdByConvId.get(convId)
			if (contextById) {
				for (const context of contextById.values()) {
					context.cancel()
				}
				this.contextByIdByConvId.delete(convId)
			}
		}
	}

	/**
	 * @param {TelegramCommander} bot
	 * @param {types.Command} commandName
	 * @param {Message} msg
	 * @param {string[]} [args]
	 * @returns {Context}
	 */
	new(bot, command, msg, args) {
		const context = new Context(bot, command, msg, args)
		this.set(context)
		return context
	}
}
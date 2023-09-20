import Context from './context.js'
import * as types from './types.js'

/**
 * @typedef {import('node-telegram-bot-api').Message} Message
 * @typedef {import('./telegram-commander.js').default} TelegramCommander
 */

export default class ContextManager {
	/** @type {Map<string, Context>} */		linearContextByConvId = new Map()
	/** @type {Map<number, Context>} */		persistentContextById = new Map()

	/**
	 * @private
	 * @param {Message} msg
	 * @returns {string}
	 */
	getConversationId(msg) {
		return `${msg.chat.id}:${msg.from?.id}`
	}

	/**
	 * @param {Context} context
	 */
	set(context) {
		switch (context.type) {
			case types.ContextType.LINEAR:
				const convId = this.getConversationId(context.msg)
				const prevContext = this.linearContextByConvId.get(convId)
				if (prevContext) {
					context.prevContext = prevContext
					this.delete(prevContext)
				}
				this.linearContextByConvId.set(convId, context)
				break
			case types.ContextType.PERSISTENT:
				this.persistentContextById.set(context.id, context)
				break
			default:
				throw new Error('unknown context type')
		}
	}

	/**
	 * Cancel the context and remove it from the context manager.
	 * @param {Context} context
	 */
	delete(context) {
		context.cancel()
		switch (context.type) {
			case types.ContextType.LINEAR:
				const convId = this.getConversationId(context.msg)
				const registeredContext = this.linearContextByConvId.get(convId)
				if (registeredContext === context) {
					this.linearContextByConvId.delete(convId)
				}
				break
			case types.ContextType.PERSISTENT:
				this.persistentContextById.delete(context.id)
				break
			default:
				throw new Error('unknown context type')
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
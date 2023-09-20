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
	 * @param {Context} context
	 */
	set(context) {
		switch (context.type) {
			case types.ContextType.LINEAR:
				const prevContext = this.linearContextByConvId.get(context.conversationId)
				if (prevContext) {
					context.prevContext = prevContext
					this.delete(prevContext)
				}
				this.linearContextByConvId.set(context.conversationId, context)
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
				const registeredContext = this.linearContextByConvId.get(context.conversationId)
				if (registeredContext === context) {
					this.linearContextByConvId.delete(context.conversationId)
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
		const context = Context.fromCommand(bot, command, msg, args)
		this.set(context)
		return context
	}
}
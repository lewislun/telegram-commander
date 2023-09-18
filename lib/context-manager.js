import Context from './context.js'
import * as types from './types.js'

/**
 * @typedef {import('node-telegram-bot-api').Message} Message
 * @typedef {import('./telegram-cli-bot').default} TelegramCliBot
 */

export default class ContextManager {
	/** @type {Map<string, Context>} */		contextBySource = new Map()

	/**
	 * @private
	 * @param {Message} msg
	 * @returns {string}
	 */
	getSource(msg) {
		return `${msg.chat.id}:${msg.from?.id}`
	}

	/**
	 * @param {Message} msg
	 * @returns {Context|undefined}
	 */
	get(msg) {
		const key = this.getSource(msg)
		return this.contextBySource.get(key)
	}

	/**
	 * @param {Context} context
	 */
	set(context) {
		const key = this.getSource(context.msg)
		const prevContext = this.contextBySource.get(key)
		if (prevContext) {
			prevContext.cancel()
			context.prevContext = prevContext
		}
		this.contextBySource.set(key, context)
	}

	/**
	 * @param {Message|Context} msgOrContext
	 */
	delete(msgOrContext) {
		const key = msgOrContext instanceof Context? this.getSource(msgOrContext.msg) : this.getSource(msgOrContext)
		const context = this.contextBySource.get(key)
		if (context) {
			context.cancel()
			this.contextBySource.delete(key)
		}
	}

	/**
	 * @param {TelegramCliBot} bot
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
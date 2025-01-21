import { escapeMarkdownV2 as e } from '../utils.js'
import TelegramCommanderPlugin from './base-plugin.js'
import { CANCEL_COMMAND_NAME } from '../telegram-commander.js'
import Context from '../context.js'

/**
 * @typedef {import('node-telegram-bot-api').Message} Message
 * @typedef {import('../telegram-commander.js').default} TelegramCommander
 */

export default class CommandNotifier extends TelegramCommanderPlugin {

	/** @type {number[]} */					chatIds = []

	/**
	 * @param {number[]} chatIds
	 */
	constructor(chatIds) {
		super()
		this.chatIds = chatIds
	}

	/**
	 * @param {TelegramCommander} bot
	 */
	init(bot) {
		super.init(bot)

		// insert hooks
		this.commander.beforeHandleCommandHooks.push(this.beforeHandleCommand.bind(this))
	}

	/**
	 * @param {Context} ctx
	 * @returns {Promise<void>}
	 */
	async beforeHandleCommand(ctx) {
		if (ctx.command.name === CANCEL_COMMAND_NAME) return
		let text = `Command /${e(ctx.command.name)} is called`
		if (ctx.triggerMsg.chat.title) {
			text += ` from Group *${e(ctx.triggerMsg.chat.title)}* \\(by \\@${e(ctx.triggerMsg.from?.username)}\\)`
		} else {
			text += ` by User \\@${e(ctx.triggerMsg.from?.username)}`
		}
		text += ` \\[${e(ctx.chatId)}\\]\\.`
		// here we do not await for the promises for performance reasons
		Promise.all(this.chatIds.map(chatId => this.commander.bot.sendMessage(chatId, text, { parse_mode: 'MarkdownV2' })))
	}
}
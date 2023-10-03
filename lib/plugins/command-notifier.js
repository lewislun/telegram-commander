import * as types from '../types.js'
import { escapeMarkdownV2 as e } from '../utils.js'
import TelegramCommanderPlugin from './base-plugin.js'
import { CANCEL_COMMAND_NAME } from '../telegram-commander.js'

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
		this.commander.beforeAuthorizeCommandHooks.push(this.beforeAuthorizeCommand.bind(this))
	}

	/**
	 * @protected
	 * @param {Message} msg
	 * @param {types.Command} cmd
	 * @returns {Promise<void>}
	 */
	async beforeAuthorizeCommand(msg, cmd) {
		if (cmd.name === CANCEL_COMMAND_NAME) return
		let text = `Command /${e(cmd.name)} is called`
		if (msg.chat.title) {
			text += ` from Group *${e(msg.chat.title)}* \\(by \\@${e(msg.from?.username)}\\)`
		} else {
			text += ` by User \\@${e(msg.from.username)}`
		}
		text += ` \\[${e(msg.chat.id)}\\]\\.`
		// here we do not await for the promises for performance reasons
		Promise.all(this.chatIds.map(chatId => this.commander.bot.sendMessage(chatId, text, { parse_mode: 'MarkdownV2' })))
	}
}
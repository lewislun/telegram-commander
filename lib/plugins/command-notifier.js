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
		let chatName
		if (msg.chat.title) {
			chatName = `Group *${e(msg.chat.title)}* \\(by \\@${e(msg.from?.username)}\\)`
		} else {
			chatName = `User \\@${e(msg.from.username)}`
		}
		const text = `Command /${e(cmd.name)} is called from ${chatName} \\[${e(msg.chat.id)}\\]\\.`
		await Promise.all(this.chatIds.map(chatId => this.commander.bot.sendMessage(chatId, text, { parse_mode: 'MarkdownV2' })))
	}
}
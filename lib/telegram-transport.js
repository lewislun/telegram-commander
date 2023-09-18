import Transport from 'winston-transport'
import { escapeMarkdownV2 } from './utils.js'

/**
 * @typedef {import('./telegram-commander.js').TelegramCommander} TelegramCliBot
 */

export default class TelegramBotTransport extends Transport {
	/** @type {TelegramCliBot} */	bot = undefined
	/** @type {number[]} */			chatIds = []

	/**
	 * @param {TelegramCliBot} bot
	 * @param {number[]} chatIds
	 * @param {object} [opts={}]
	 * @param {Transport.TransportStreamOptions} [opts.transportOpts]
	 */
	constructor(bot, chatIds, opts={}) {
		super(opts?.transportOpts)
		this.bot = bot
		this.chatIds = chatIds
	}

	/**
	 * @param {*} info
	 * @param {function} next
	 */
	log(info, next) {
		if (this.chatIds && this.chatIds.length > 0) {
			const content = [
				// TODO: emoji by level
				`\u{1F6A8} *${info.level?.toUpperCase()} Notification* \u{1F6A8}`,
				`Message: *${escapeMarkdownV2(info.message)}*`,
			]
			for (const chatId of this.chatIds) {
				this.bot.sendMessage(chatId, content, { parse_mode: 'MarkdownV2' })
			}
		}
		next()
	}
}
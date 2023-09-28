import Transport from 'winston-transport'
import { escapeMarkdownV2 } from './utils.js'

/**
 * @typedef {import('./telegram-commander.js').default} TelegramCommander
 */

export default class TelegramBotTransport extends Transport {
	/** @type {TelegramCommander} */	commander = undefined
	/** @type {number[]} */				chatIds = []

	/**
	 * @param {TelegramCommander} bot
	 * @param {number[]} chatIds
	 * @param {object} [opts={}]
	 * @param {Transport.TransportStreamOptions} [opts.transportOpts]
	 */
	constructor(bot, chatIds, opts={}) {
		super(opts?.transportOpts)
		this.commander = bot
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
				this.commander.sendMessage(chatId, content, { parse_mode: 'MarkdownV2' })
			}
		}
		next()
	}
}
import TelegramBot from 'node-telegram-bot-api'
import c from 'chalk'

import { escapeMarkdownV2 } from './utils.js'

/**
 * @typedef {import('winston').Logger} Logger
 * @typedef {import('node-telegram-bot-api').SendMessageOptions} SendMessageOptions
 * @typedef {import('node-telegram-bot-api').Message} Message
 * @typedef {import('./types.js').Command} Command
 * @typedef {import('./types.js').CommandHandler} CommandHandler
 * @typedef {import('./types.js').TelegramCliBotOptions} TelegramCliBotOptions
 */

export default class TelegramCliBot extends TelegramBot {
	/** @type {Logger} */				logger = undefined
	/** @type {Command[]} */			commands = []
	/** @type {Set<number>} */			whitelistedChatIdSet = undefined

	/**
	 * @param {string} token
	 * @param {TelegramCliBotOptions} [opts={}]
	 */
	constructor(token, opts = {}) {
		super(token, { polling: true })
		this.logger = opts?.logger

		// store whitelisted chat ids in a set for faster lookup
		if (opts?.whitelistedChatIds) {
			this.whitelistedChatIdSet = new Set(opts.whitelistedChatIds)
		}
		
		// register default commands
		if (opts.enableStartCommand ?? true) {
			this.addCommand({
				name: 'start',
				description: 'Show available commands',
				handler: async msg => await this.sendCommandInfos(msg.chat.id),
			})
		}
		if (opts.enableHelpCommand ?? true) {
			this.addCommand({
				name: 'help',
				description: 'Alias of /start',
				handler: async msg => await this.sendCommandInfos(msg.chat.id),
			})
		}
		if (opts.enableChatIdCommand ?? true) {
			this.addCommand({
				name: 'chatid',
				description: 'Get this chat\'s id',
				handler: async msg => await this.sendMessage(msg.chat.id, `Chat id: ${msg.chat.id}\\.`),
			})
		}
	}

	async sendCommandInfos(chatId) {
		await this.sendMessage(chatId, [
			'Available commands:',
			...this.commands.map(cmd => {
				let msg = `/${escapeMarkdownV2(cmd.name)}`
				if (cmd.args && cmd.args.length > 0) {
					msg += ` ${cmd.args.map(n => `_\\<${escapeMarkdownV2(n)}\\>_`).join(' ')}`
				}
				if (cmd.optionalArgs && cmd.optionalArgs.length > 0) {
					msg += ` ${cmd.optionalArgs.map(n => `_[${escapeMarkdownV2(n)}]_`).join(' ')}`
				}
				msg += ` \\- ${cmd.description ?? 'No description provided.'}`
				return msg
			}),
		], { parse_mode: 'MarkdownV2' })
	}

	/**
	 * @param {number} chatId
	 * @returns {boolean}
	 */
	isChatIdWhitelisted(chatId) {
		return this.whitelistedChatIdSet?.has(chatId) ?? true
	}

	/**
	 * @param {Command} cmd
	 */
	addCommand(cmd) {
		const { name, handler, args, optionalArgs, description } = cmd
		this.commands.push({ name, handler, args, optionalArgs, description })
		let regexStr = `^/(${name})`
		if (Array.isArray(args) && args.length > 0) {
			for (const _ of args) {
				// TODO: support double quotes
				regexStr += ` (.+)`
			}
		}
		// TODO: support optional args
		// TODO: warn user if not enough args
		super.onText(new RegExp(regexStr), async (msg, match) => {
			try {
				// TODO: session
				if (!this.isChatIdWhitelisted(msg.chat.id)) {
					this.logger?.warn(`Unauthorized command /${name} from chat ${msg.chat.id}.`)
					return
				}
				await handler(msg, {}, ...match.slice(2))
			} catch (err) {
				this.logger?.error(`Error occurred while handling command /${name}: ${err}`)
				// TODO: flag to disable error message
				await this.sendMessage(msg.chat.id, escapeMarkdownV2(`Error occurred while handling command /${name}: ${err}`), { parse_mode: 'MarkdownV2' })
			}
		})
		this.logger?.info(`Registered command ${c.yellow('/' + name)}.`)
	}

	/**
	 * @param {number|number[]} chatIds
	 * @param {string|string[]} content
	 * @param {SendMessageOptions} [opts={}]
	 * @returns {Promise<Message[]>}
	 */
	async sendMessage(chatIds, content, opts = {}) {
		opts = opts ?? {}
		if (!opts.parse_mode) {
			opts.parse_mode = 'MarkdownV2'
		}
		if (Array.isArray(content)) {
			content = content.join('\n')
		}
		if (!Array.isArray(chatIds)) {
			chatIds = [chatIds]
		}
	
		try {
			const msgs = []
			for (const chatId of chatIds) {
				const msg = await super.sendMessage(chatId, content, opts)
				msgs.push(msg)
				this.logger?.info(`Message sent to chat ${chatIds}.`)
			}
			return msgs
		} catch (error) {
			this.logger?.error(`Failed to send telegram message to chat ${chatIds}.`)
			throw error
		}
	}
}
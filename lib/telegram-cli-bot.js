import TelegramBot from 'node-telegram-bot-api'
import c from 'chalk'

import { escapeMarkdownV2 } from './utils.js'

/**
 * @typedef {import('winston').Logger} Logger
 * @typedef {import('node-telegram-bot-api').SendMessageOptions} SendMessageOptions
 * @typedef {import('node-telegram-bot-api').Message} Message
 * @typedef {import('./types.js').Command} Command
 * @typedef {import('./types.js').Session} Session
 * @typedef {import('./types.js').CommandHandler} CommandHandler
 * @typedef {import('./types.js').TelegramCliBotOptions} TelegramCliBotOptions
 */

export default class TelegramCliBot extends TelegramBot {
	/** @type {Logger} */					logger = undefined
	/** @type {Set<number>} */				whitelistedChatIdSet = undefined
	/** @type {Map<string, Command>} */		commandByName = new Map()
	/** @type {Map<number, Session>} */		sessionByUserId = new Map()

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
		
		// log errors
		this.on('polling_error', err => {
			this.logger?.error(`Polling error: ${err}`)
		})

		// handle session messages
		this.on('message', async msg => {
			if (msg.text?.startsWith('/') || !this.sessionByUserId.has(msg.from.id)) return
			const session = this.sessionByUserId.get(msg.from.id)
			if (!this.commandByName.has(session._commandName)) return
			const cmd = this.commandByName.get(session._commandName)
			await cmd.handler(msg, session)
		})

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

	/**
	 * @param {number[]|number} chatIds
	 */
	async sendCommandInfos(chatIds) {
		await this.sendMessage(chatIds, [
			'Available commands:',
			...Array.from(this.commandByName.values()).map(cmd => {
				let msg = `/${escapeMarkdownV2(cmd.name)}`
				if (cmd.params && cmd.params.length > 0) {
					msg += ` ${cmd.params.map(n => `_\\<${escapeMarkdownV2(n)}\\>_`).join(' ')}`
				}
				if (cmd.optionalParams && cmd.optionalParams.length > 0) {
					msg += ` ${cmd.optionalParams.map(n => `_[${escapeMarkdownV2(n)}]_`).join(' ')}`
				}
				msg += ` \\- ${cmd.description ?? 'No description provided\\.'}`
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
		// TODO: check if command already exists
		// TODO: check if command is valid
		cmd = {
			name: cmd.name,
			handler: cmd.handler,
			params: cmd.params ?? [],
			optionalParams: cmd.optionalParams ?? [],
			description: cmd.description,
			sessionEnabled: cmd.sessionEnabled ?? false,
		}
		this.commandByName.set(cmd.name, cmd)
		super.onText(new RegExp(`^/(${cmd.name})`), async (msg, _) => {
			try {
				// ensure chat id is whitelisted
				if (!this.isChatIdWhitelisted(msg.chat.id)) {
					this.logger?.warn(`Unauthorized command /${cmd.name} from chat ${msg.chat.id}.`)
					return
				}

				// create new session
				if (cmd.sessionEnabled && msg.from?.id) {
					this.sessionByUserId.set(msg.from.id, {
						_commandName: cmd.name,
						end: () => this.sessionByUserId.delete(msg.from.id),
					})
				} else {
					this.sessionByUserId.delete(msg.from?.id)
				}

				// get arguments
				const minParamLength = (cmd.params.length ?? 0)
				const maxParamLength = minParamLength + (cmd.optionalParams.length ?? 0)
				const args = msg.text
					.replace(/[“”"]/g, '"')
					.match(/\s+("[^"]+"|[^"\s]+)/g)
					?.map(arg => arg.trim().replace(/^"(.+)"$/, '$1')) ?? []
				if (args.length < minParamLength || args.length > maxParamLength) {
					await this.sendMessage(msg.chat.id, [
						`Invalid number of arguments for command /${cmd.name}\\.`,
						`Required: ${minParamLength}${cmd.optionalParams.length? `\\-${maxParamLength}` : ''}, provided: ${args.length}`
					], { parse_mode: 'MarkdownV2' })
					this.logger?.warn(`Invalid number of arguments for command /${cmd.name} from chat ${msg.chat.id}.`)
					return
				}

				// call handler
				await cmd.handler(msg, this.sessionByUserId.get(msg.from?.id), ...args)
			} catch (err) {
				this.logger?.error(`Error occurred while handling command /${cmd.name}: ${err}`)
				// TODO: flag to disable error message
				await this.sendMessage(msg.chat.id, escapeMarkdownV2(`Error occurred while handling command /${cmd.name}: ${err}`), { parse_mode: 'MarkdownV2' })
			}
		})
		this.logger?.info(`Registered command ${c.yellow('/' + cmd.name)}.`)
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
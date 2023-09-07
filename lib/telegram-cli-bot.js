import TelegramBot from 'node-telegram-bot-api'
import c from 'chalk'

/**
 * @typedef {import('winston').Logger} Logger
 * @typedef {import('node-telegram-bot-api').SendMessageOptions} SendMessageOptions
 * @typedef {import('node-telegram-bot-api').Message} Message
 * @typedef {import('./types.js').Command} Command
 * @typedef {import('./types.js').CommandHandler} CommandHandler
 * @typedef {import('./types.js').TelegramCliBotOptions} TelegramCliBotOptions
 */

export default class TelegramCliBot {
	/** @type {Logger} */				logger = undefined
	/** @type {TelegramBot} */			bot = undefined
	/** @type {Command[]} */			commands = []

	/**
	 * @param {string} token
	 * @param {TelegramCliBotOptions} [opts={}]
	 */
	constructor(token, opts = {}) {
		this.bot = new TelegramBot(token, { polling: true })
		this.logger = opts?.logger

		// register default commands
		if (opts.enableStartCommand ?? true) {
			this.addCommand('start', [], 'Show available commands', async (msg, _) => await this.sendCommandInfos(msg.chat.id))
		}
		if (opts.enableHelpCommand ?? true) {
			this.addCommand('help', [], 'Alias of /start', async (msg, _) => await this.sendCommandInfos(msg.chat.id))
		}
		if (opts.enableChatIdCommand ?? true) {
			this.addCommand('chatid', [], `Get this chat's id`, async (msg, _) => await this.sendMessage(msg.chat.id, `Chat id: ${msg.chat.id}.`))
		}
	}

	async sendCommandInfos(chatId) {
		await this.sendMessage(chatId, [
			'Available commands:',
			...this.commands.map(cmd => `/${cmd.name}${cmd.argNames && ' '}${cmd.argNames?.map(n => `\`&lt;${n}&gt;\``).join(' ')} - ${cmd.description ?? 'No description provided.'}`)
		])
	}

	/**
	 * @param {string} name
	 * @param {CommandHandler} handler
	 * @param {string[]} [argNames]
	 * @param {string} [description]
	 */
	async addCommand(name, argNames = [], description = undefined, handler) {
		this.commands.push({ name, handler, argNames, description })
		let regexStr = `^/(${name})`
		for (const _ of argNames) {
			// TODO: support double quotes
			// TODO: support optional args
			regexStr += ` (.+)`
		}
		this.bot.onText(new RegExp(regexStr), async (msg, match) => {
			try {
				await handler(msg, ...match.slice(2))
			} catch (err) {
				this.logger?.error(`Error occurred while handling command /${name}: ${err}`)
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
				const msg = await this.bot.sendMessage(chatId, content, opts)
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
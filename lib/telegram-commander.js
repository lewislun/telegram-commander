import TelegramBot from 'node-telegram-bot-api'
import c from 'chalk'

import { escapeMarkdownV2 } from './utils.js'
import Context from './context.js'
import ContextManager from './context-manager.js'
import ReplyListenerRegistry from './reply-listener-registry.js'
import * as types from './types.js'

/**
 * @typedef {import('winston').Logger} Logger
 * @typedef {import('node-telegram-bot-api').SendMessageOptions} SendMessageOptions
 * @typedef {import('node-telegram-bot-api').ParseMode} ParseMode
 * @typedef {import('node-telegram-bot-api').Message} Message
 * @typedef {import('node-telegram-bot-api').User} User
 */

const START_COMMAND_NAME = 'start'
const CANCEL_COMMAND_NAME = 'cancel'

export default class TelegramCommander extends TelegramBot {
	/** @type {Logger|Console} */					logger = undefined
	/** @type {Set<number>} */						whitelistedChatIdSet = undefined
	/** @type {Map<string, types.Command>} */		commandByName = new Map()
	/** @type {ParseMode} */						defaultParseMode = 'MarkdownV2'
	/** @type {boolean} */							errorReplyEnabled = true
	/** @type {User} */								botUser = undefined
	/** @protected @type {ContextManager} */		contextManager = new ContextManager()
	/** @protected @type {ReplyListenerRegistry} */	replyListenerRegistry = new ReplyListenerRegistry()

	/**
	 * @param {string} token
	 * @param {types.TelegramCommanderOptions} [opts={}]
	 */
	constructor(token, opts = {}) {
		super(token, { polling: true })
		this.logger = opts?.logger
		this.defaultParseMode = opts?.defaultParseMode ?? this.defaultParseMode
		this.errorReplyEnabled = opts?.errorReplyEnabled ?? this.errorReplyEnabled

		// store whitelisted chat ids in a set for faster lookup
		if (opts?.whitelistedChatIds) {
			this.whitelistedChatIdSet = new Set(opts.whitelistedChatIds)
		}

		// log errors
		this.on('polling_error', err => {
			this.logger?.error(`Polling error: ${err}`)
		})

		// handle messages
		this.on('message', async msg => {
			if (msg.text?.startsWith('/')) {
				await this.handleCommand(msg)
			} else {
				await this.replyListenerRegistry.handleMessage(msg)
			}
		})

		// handle callback query
		this.on('callback_query', async query => {
			await this.replyListenerRegistry.handleCallbackQuery(query)
		})

		// register default commands
		if (opts?.startCommandEnabled ?? true) {
			this.addCommand({
				name: START_COMMAND_NAME,
				description: 'Show available commands',
				handler: async ctx => await this.handleStartCommand(ctx),
			})
		}
		if (opts?.cancelCommandEnabled ?? true) {
			this.addCommand({
				name: CANCEL_COMMAND_NAME,
				description: 'Cancel the current command',
				handler: async ctx => await this.handleCancelCommand(ctx),
			})
		}
	}

	/**
	 * Get all registered commands, with /cancel at the end.
	 * @returns {types.Command[]}
	 */
	get commands() {
		const commands = Array.from(this.commandByName.values())
			.filter(cmd => cmd.name !== CANCEL_COMMAND_NAME) // put /cancel at the end
		if (this.commandByName.has(CANCEL_COMMAND_NAME)) {
			commands.push(this.commandByName.get(CANCEL_COMMAND_NAME))
		}
		return commands
	}

	/**
	 * @param {Context} ctx
	 */
	async handleStartCommand(ctx) {
		const infos = this.commands
			.filter(cmd => cmd.enabled && cmd.startCommandEnabled)
			.map(cmd => {
				let msg = `/${escapeMarkdownV2(cmd.name)}`
				if (cmd.params && cmd.params.length > 0) {
					msg += ` ${cmd.params.map(n => `_\\<${escapeMarkdownV2(n)}\\>_`).join(' ')}`
				}
				if (cmd.optionalParams && cmd.optionalParams.length > 0) {
					msg += ` ${cmd.optionalParams.map(n => `_\\[${escapeMarkdownV2(n)}\\]_`).join(' ')}`
				}
				msg += ` \\- ${escapeMarkdownV2(cmd.description) ?? ''}`
				return msg
			})

		await ctx.reply([
			'Available commands:',
			...infos,
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
	 * @private
	 * @param {Context} ctx
	 */
	async handleCancelCommand(ctx) {
		if (!ctx.prevContext) {
			await ctx.reply('No command to cancel\\.')
			return
		}
		await ctx.reply(`Command /${ctx.prevContext.command.name} cancelled\\.`)
	}

	/**
	 * @private
	 * @param {Message} msg
	 */
	async handleCommand(msg) {
		// get username
		if (!this.botUser) {
			this.botUser = await this.getMe()
		}

		// check if command is for this bot
		const cmdStr = msg.text.split(' ')[0]
		if (cmdStr.match(/\@/)) {
			const username = cmdStr.split('@')[1]
			if (username !== this.botUser.username) {
				this.logger?.info(`Command ${c.yellow(cmdStr)} is not for this bot (${c.green(`@${this.botUser.username}`)}).`)
				return
			}
		}

		const commandName = cmdStr?.substring(1)?.split('@')[0]
		const cmd = this.commandByName.get(commandName)
		if (!cmd || !cmd.enabled) return

		/** @type {Context} */
		let context
		try {
			// ensure chat id is whitelisted
			if (!this.isChatIdWhitelisted(msg.chat.id)) {
				this.logger?.warn(`Unauthorized command /${cmd.name} from chat ${msg.chat.id}.`)
				return
			}

			// get arguments
			// TODO: make it a function
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

			// create context call handler
			context = this.contextManager.new(this, cmd, msg, args)
			await cmd.handler(context)

		} catch (err) {
			// ignore context cancel error
			if (err instanceof types.ContextCancelError) {
				this.logger?.info(`Context cancelled while waiting for message in /${cmd.name}.`)

			} else {
				this.logger?.error(`Error occurred while handling command /${cmd.name}: ${err}`)
				if (this.errorReplyEnabled) {
					await this.sendMessage(msg.chat.id, escapeMarkdownV2(`Error occurred while handling command /${cmd.name}: ${err}`), { parse_mode: 'MarkdownV2' })
				}
			}
		}

		if (context) {
			this.contextManager.delete(context)
		}
	}

	/**
	 * @param {types.Command} cmd
	 */
	addCommand(cmd) {
		if (!cmd.name) throw new Error('Command name is required.')
		if (!cmd.handler) throw new Error('Command handler is required.')
		if (this.commandByName.has(cmd.name)) throw new Error(`Command ${cmd.name} already exists.`)

		cmd = {
			name: cmd.name,
			handler: cmd.handler,
			params: cmd.params ?? [],
			optionalParams: cmd.optionalParams ?? [],
			description: cmd.description ?? 'No description provided.',
			enabled: cmd.enabled ?? true,
			startCommandEnabled: cmd.startCommandEnabled ?? true,
			listingEnabled: cmd.listingEnabled ?? true,
		}
		this.commandByName.set(cmd.name, cmd)
		this.logger?.info(`Registered command ${c.yellow('/' + cmd.name)}.`)
	}

	/**
	 * Sync commands with telegram. Commands will be shown in the command list in the chat with the bot.
	 * Commands with params will not be synced. (since clicking on the command list will instantly send the command without params in Telegram)
	 */
	async syncCommands() {
		const commands = this.commands
			.filter(cmd => cmd.enabled && cmd.listingEnabled && (cmd.params?.length ?? 0) === 0)
			.map(cmd => ({
				command: cmd.name,
				description: cmd.description,
			}))
		await this.setMyCommands(commands)
		this.logger?.info(`Synced commands with telegram.`)
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
			opts.parse_mode = this.defaultParseMode
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
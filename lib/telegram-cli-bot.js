import TelegramBot from 'node-telegram-bot-api'
import c from 'chalk'

import { escapeMarkdownV2 } from './utils.js'
import Context from './context.js'
import ContextManager from './context-manager.js'
import * as types from './types.js'

/**
 * @typedef {import('winston').Logger} Logger
 * @typedef {import('node-telegram-bot-api').SendMessageOptions} SendMessageOptions
 * @typedef {import('node-telegram-bot-api').Message} Message
 */

const START_COMMAND_NAME = 'start'
const CHAT_ID_COMMAND_NAME = 'chatid'
const CANCEL_COMMAND_NAME = 'cancel'

export default class TelegramCliBot extends TelegramBot {
	/** @type {Logger} */							logger = undefined
	/** @type {Set<number>} */						whitelistedChatIdSet = undefined
	/** @type {Map<string, types.Command>} */		commandByName = new Map()
	/** @type {ContextManager} */					contextManager = new ContextManager()

	/**
	 * @param {string} token
	 * @param {types.TelegramCliBotOptions} [opts={}]
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

		// handle messages
		this.on('message', async msg => {
			if (msg.text?.startsWith('/')) {
				await this.handleCommand(msg)
			} else {
				await this.handleContextReply(msg)
			}
		})

		// register default commands
		if (opts?.enableStartCommand ?? true) {
			this.addCommand({
				name: START_COMMAND_NAME,
				description: 'Show available commands',
				handler: async msg => await this.handleStartCommand(msg.chat.id),
			})
		}
		if (opts?.enableChatIdCommand ?? false) {
			this.addCommand({
				name: CHAT_ID_COMMAND_NAME,
				description: 'Get this chat\'s id',
				handler: async msg => await this.sendMessage(msg.chat.id, `Chat id: ${msg.chat.id}\\.`),
			})
		}
		if (opts?.enableCancelCommand ?? true) {
			this.addCommand({
				name: CANCEL_COMMAND_NAME,
				description: 'Cancel the current command',
				handler: async msg => await this.handleCancelCommand(msg),
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
	 * @param {number[]|number} chatIds
	 */
	async handleStartCommand(chatIds) {
		const infos = this.commands
			.filter(cmd => cmd.enabled && cmd.helpMsgEnabled)
			.map(cmd => {
				let msg = `/${escapeMarkdownV2(cmd.name)}`
				if (cmd.params && cmd.params.length > 0) {
					msg += ` ${cmd.params.map(n => `_\\<${escapeMarkdownV2(n)}\\>_`).join(' ')}`
				}
				if (cmd.optionalParams && cmd.optionalParams.length > 0) {
					msg += ` ${cmd.optionalParams.map(n => `_[${escapeMarkdownV2(n)}]_`).join(' ')}`
				}
				msg += ` \\- ${escapeMarkdownV2(cmd.description) ?? ''}`
				return msg
			})

		await this.sendMessage(chatIds, [
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
	 * @returns {Promise<boolean>} true if the message is handled by a context
	 */
	async handleContextReply(msg) {
		if (!msg.from) return
		const context = this.contextManager.get(msg)
		if (context && context.isWaitingForMessage) {
			context.receiveMessage(msg)
			return true
		}

		return false
	}

	/**
	 * @private
	 * @param {Message} msg
	 */
	async handleCommand(msg) {
		const commandName = msg.text.split(' ')[0].substring(1)
		const cmd = this.commandByName.get(commandName)
		if (!cmd || !cmd.enabled) return

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
			const context = this.contextManager.new(this, cmd, msg, args)
			await cmd.handler(context)
			this.contextManager.delete(msg)

		} catch (err) {
			// ignore context cancel error
			if (err instanceof types.ContextCancelError) {
				this.logger?.info(`Context cancelled while waiting for message in /${cmd.name}.`)
				return
			}

			this.logger?.error(`Error occurred while handling command /${cmd.name}: ${err}`)
			// TODO: flag to disable error message
			await this.sendMessage(msg.chat.id, escapeMarkdownV2(`Error occurred while handling command /${cmd.name}: ${err}`), { parse_mode: 'MarkdownV2' })
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
			helpMsgEnabled: cmd.helpMsgEnabled ?? true,
		}
		this.commandByName.set(cmd.name, cmd)
		this.logger?.info(`Registered command ${c.yellow('/' + cmd.name)}.`)
	}

	/**
	 * Sync commands with telegram. Commands will be shown in the command list in the chat with the bot.
	 */
	async syncCommands() {
		const commands = this.commands
			.filter(cmd => cmd.enabled && cmd.helpMsgEnabled)
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
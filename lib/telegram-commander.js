import TelegramBot from 'node-telegram-bot-api'
import c from 'chalk'

import { escapeMarkdownV2 as e } from './utils.js'
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
 * @typedef {import('./plugins').TelegramCommanderPlugin} TelegramCommanderPlugin
 * 
 * @typedef {(cmd: types.Command) => Promise<void>} AfterAddCommandHook
 * @typedef {(ctx: Context) => Promise<boolean>} CheckCommandPermissionHook
 * @typedef {(ctx: Context) => Promise<void>} BeforeHandleCommandHook
 */

export const START_COMMAND_NAME = 'start'
export const CANCEL_COMMAND_NAME = 'cancel'

export default class TelegramCommander {
  /** @type {TelegramBot} */                            bot = undefined
  /** @type {Logger|Console} */                         logger = undefined
  /** @type {Set<number>} */                            whitelistedChatIdSet = undefined
  /** @type {Map<string, types.Command>} */             commandByName = new Map()
  /** @type {User} */                                   botUser = undefined
  /** @type {TelegramCommanderPlugin[]} */              plugins = []
  /** @type {types.TelegramCommanderOptions} */         opts = {}
  /** @protected @type {ContextManager} */              contextManager = new ContextManager()
  /** @protected @type {ReplyListenerRegistry} */       replyListenerRegistry = new ReplyListenerRegistry()

  /** @type {AfterAddCommandHook[]} Runs after command is added */
  afterAddCommandHooks = []
  /** @type {CheckCommandPermissionHook[]} Command is not authorized if one of these hooks returns false */
  checkCommandPermissionHooks = []
  /** @type {BeforeHandleCommandHook[]} Runs before command handler is called */
  beforeHandleCommandHooks = []

  /**
   * @param {string} token
   * @param {types.TelegramCommanderOptions} [opts={}]
   */
  constructor(token, opts = {}) {
    this.bot = new TelegramBot(token, { polling: true })

    // options
    this.logger = opts?.logger
    this.plugins = opts?.plugins ?? this.plugins
    this.opts = {
      defaultParseMode: 'MarkdownV2',
      errorReplyEnabled: true,
      unauthorizedReplyEnabled: true,
      ...(opts ?? {}),
    }

    // store whitelisted chat ids in a set for faster lookup
    if (opts?.whitelistedChatIds) {
      this.whitelistedChatIdSet = new Set(opts.whitelistedChatIds)
      this.checkCommandPermissionHooks.push(this.isWhitelisted.bind(this))
    }

    // register plugins
    for (const plugin of this.plugins) {
      plugin.init(this)
    }

    // log errors
    this.bot.on('polling_error', err => {
      this.logger?.error(`Polling error: ${err}`)
    })

    // handle messages
    this.bot.on('message', async msg => {
      if (msg.text?.startsWith('/')) {
        await this.handleCommand(msg)
      } else {
        await this.replyListenerRegistry.handleMessage(msg)
      }
    })

    // handle callback query
    this.bot.on('callback_query', async query => {
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
        description: 'Cancel the current conversation',
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
    const DEFAULT_CATEGORY = 'Others'
    const categories = []
    const commands = this.commands.filter(cmd => cmd.enabled && cmd.startCommandEnabled)
    const cmdsByCategory = new Map()
    for (const cmd of commands) {
      const category = cmd.category ?? DEFAULT_CATEGORY
      if (!cmdsByCategory.has(category)) {
        cmdsByCategory.set(category, [])
        category != DEFAULT_CATEGORY && categories.push(category)
      }
      cmdsByCategory.get(category).push(cmd)
    }
    categories.push(DEFAULT_CATEGORY)

    const parseCommandInfo = cmd => {
      let msg = `/${e(cmd.name)}`
      if (cmd.params && cmd.params.length > 0) {
        msg += ` ${cmd.params.map(n => `_\\<${e(n)}\\>_`).join(' ')}`
      }
      if (cmd.optionalParams && cmd.optionalParams.length > 0) {
        msg += ` ${cmd.optionalParams.map(n => `_\\[${e(n)}\\]_`).join(' ')}`
      }
      msg += ` \\- ${e(cmd.description) ?? ''}`
      return msg
    }

    const infos = []
    for (const category of categories) {
      infos.push(``)
      // show category name only if there are categories other than default
      if (categories.length > 1) {
        infos.push(`*${e(category)}*`)
      }
      infos.push(...cmdsByCategory.get(category).map(parseCommandInfo))
    }

    await ctx.reply([
      'Available commands:',
      ...infos,
    ], { parse_mode: 'MarkdownV2' })
  }

  /**
   * @private
   * @param {Context} ctx
   */
  async handleCancelCommand(ctx) {
    // Group context should have been deleted from context manager upon reaching this line, but we have to find and delete non-group context manually
    const nonGroupConvoId = Context.getConversationId(ctx.chatId, ctx.triggerMsg?.from?.id)
    const nonGroupContext = this.contextManager.linearContextByConvoId.get(nonGroupConvoId)

    if (!ctx.prevContext && !nonGroupContext) {
      await ctx.reply('No conversation to cancel\\.')
      return
    }

    if (ctx.prevContext) {
      if (ctx.prevContext.command) {
        await ctx.reply(`Command /${e(ctx.prevContext.command.name)} cancelled\\.`)
      } else {
        await ctx.reply('Conversation cancelled\\.')
      }
    }
    if (nonGroupContext) {
      this.contextManager.delete(nonGroupContext)
      if (nonGroupContext.command) {
        await ctx.reply(`Command /${e(nonGroupContext.command.name)} cancelled\\.`)
      } else {
        await ctx.reply('Conversation cancelled\\.')
      }
    }
  }

  /**
   * @param {Context} ctx
   * @returns {Promise<boolean>}
   */
  async isWhitelisted(ctx) {
    return this.whitelistedChatIdSet?.has(ctx.chatId)
  }

  /**
   * @private
   * @param {Message} msg
   */
  async handleCommand(msg) {
    // get username
    if (!this.botUser) {
      this.botUser = await this.bot.getMe()
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
    let ctx
    try {
      // get arguments
      // TEST: argument parsing
      const minParamLength = (cmd.params.length ?? 0)
      const maxParamLength = minParamLength + (cmd.optionalParams.length ?? 0)
      const args = msg.text
        .replace(/[""]/g, '"')
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

      // create context
      ctx = this.contextManager.new(this, cmd, msg, args)

      // check if user is permitted to use this command
      let isPermitted = true
      for (const hook of this.checkCommandPermissionHooks) {
        isPermitted = await hook(ctx)
        if (!isPermitted) break
      }
      if (!isPermitted) {
        this.logger?.warn(`Unauthorized command /${cmd.name} from chat ${msg.chat.id}.`)
        if (this.opts.unauthorizedReplyEnabled) {
          await this.sendMessage(msg.chat.id, 'Sorry, you are not authorized to use this command\\.', { parse_mode: 'MarkdownV2' })
        }
        return
      }

      // call handler
      for (const hook of this.beforeHandleCommandHooks) {
        await hook(ctx)
      }
      await cmd.handler(ctx)

    } catch (err) {
      // ignore context cancel error
      if (err instanceof types.ContextCancelError) {
        this.logger?.info(`Context cancelled while waiting for message in /${cmd.name}.`)

      } else {
        this.logger?.error(`Error occurred while handling command /${cmd.name}: ${err}\n${err.stack}`)
        if (this.opts.errorReplyEnabled) {
          await this.sendMessage(msg.chat.id, e(`Error occurred while handling command /${cmd.name}: ${err}`), { parse_mode: 'MarkdownV2' })
        }
      }
    }

    if (ctx) {
      this.contextManager.delete(ctx)
    }
  }

  /**
   * @param {types.Command} cmd
   */
  async addCommand(cmd) {
    if (!cmd.name) throw new Error('Command name is required.')
    if (!cmd.handler) throw new Error('Command handler is required.')
    if (this.commandByName.has(cmd.name)) throw new Error(`Command ${cmd.name} already exists.`)

    cmd = {
      ...cmd,
      contextType: cmd.contextType ?? types.ContextType.LINEAR,
      params: cmd.params ?? [],
      optionalParams: cmd.optionalParams ?? [],
      description: cmd.description ?? 'No description provided.',
      enabled: cmd.enabled ?? true,
      startCommandEnabled: cmd.startCommandEnabled ?? true,
      listingEnabled: cmd.listingEnabled ?? true,
      groupMode: cmd.groupMode ?? true,
    }
    this.commandByName.set(cmd.name, cmd)
    this.logger?.info(`Registered command ${c.yellow('/' + cmd.name)}.`)
    
    for (const handler of this.afterAddCommandHooks) {
      await handler(cmd)
    }
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
    await this.bot.setMyCommands(commands)
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
    opts.parse_mode = opts.parse_mode ?? this.opts.defaultParseMode
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
        this.logger?.debug(`Message sent to chat ${chatIds}: ${content}`)
      }
      return msgs
    } catch (error) {
      this.logger?.error(`Failed to send telegram message to chat ${chatIds}.`)
      throw error
    }
  }

  /**
   * @param {number} chatId
   * @param {object} [opts={}]
   * @param {types.ContextType} [opts.type='linear']
   * @param {number} [opts.targetUserId] If specified, only replies from this user will be handled.
   * @param {(ctx: Context) => Promise<void>} handler
   */
  async newConversation(chatId, opts = {}, handler) {
    const context = new Context(this, chatId, {
      type: opts?.type,
      targetUserId: opts?.targetUserId,
    })
    this.contextManager.set(context)

    await handler(context)
  }
}
import * as types from '../types.js'
import { escapeMarkdownV2 } from '../utils.js'
import TelegramCommanderPlugin from './base-plugin.js'
import { CANCEL_COMMAND_NAME } from '../telegram-commander.js'

/**
 * @typedef {import('winston').Logger} Logger
 * @typedef {import('node-telegram-bot-api').Message} Message
 * @typedef {import('../telegram-commander.js').default} TelegramCommanderOptions
 * @typedef {import('./base-plugin.js').StorageConfig} StorageConfig
 * 
 * @typedef CommandGroup
 * @property {string} permission
 * @property {string} description
 * @property {(string|RegExp)[]} commandNames
 * @property {boolean} [approvable=true]
 * @property {boolean} [noAuth=false] If true, do not check for permission.
 * @property {number[]} [approverChatIds] If not set, use the defaultApproverChatIds.
 * 
 * @typedef ChatPermission
 * @property {number} usageCount
 */

/**
 * @enum {string}
 */
export const ApprovalResult = {
	APPROVED: 'approved',
	REJECTED: 'rejected',
	JUST_THIS_TIME: 'just_this_time',
	// TODO: BLOCK
}

export default class CommandAuth extends TelegramCommanderPlugin {

	/** @type {Map<string, CommandGroup>} */			groupByPermission = new Map()
	/** @type {Map<string, string} */					permissionByCommandName = new Map()
	/** @type {number[]} */								defaultApproverChatIds = undefined
	/** @type {CommandGroup[]} */						groups = undefined
	/** @protected @type {Logger} */					logger = undefined
	/** @protected @type {Map<string, number>} */		usageCountByChatPermission = new Map()

	/**
	 * @param {CommandGroup[]} groups
	 * @param {object} [opts={}]
 	 * @param {Logger} [opts.logger] If not set, use the logger from TelegramCommander.
	 * @param {number[]} [opts.defaultApproverChatIds] If not set, use the whitelistedChatIds from TelegramCommander.
	 * @param {StorageConfig} [opts.storage] Persistent storage for permissions. If not set, use in-memory storage.
	 */
	constructor(groups, opts = {}) {
		super({ storage: opts?.storage })
		this.defaultApproverChatIds = opts?.defaultApproverChatIds ?? this.defaultApproverChatIds
		this.logger = opts?.logger ?? this.logger
		this.groups = groups

		// init groups
		for (const group of this.groups) {
			group.approvable = group.approvable ?? true
			if (this.groupByPermission.has(group.permission)) {
				throw new Error(`Duplicated group permission: ${group.permission}`)
			}
			this.groupByPermission.set(group.permission, group)
		}
	}

	/**
	 * @param {TelegramCommander} bot
	 */
	init(bot) {
		super.init(bot)
		this.logger = this.logger ?? bot.logger
		this.defaultApproverChatIds = this.defaultApproverChatIds ?? [ ...bot.whitelistedChatIdSet ]
		this.logger?.info(`CommandMonitor: defaultApproverChatIds: ${this.defaultApproverChatIds}`)
		// TODO: start command hide no auth + not approvable commands

		// override authorizeCommand
		this.commander.authorizeCommand = this.authorizeCommand.bind(this)
		// insert hooks
		this.commander.beforeAuthorizeCommandHooks.push(this.beforeAuthorizeCommand.bind(this))
		this.commander.afterAddCommandHooks.push(this.afterAddCommand.bind(this))
	}

	/**
	 * Checks if the chat is authorized to call the command and CONSUME permission usage count if needed.
	 * @param {Message} msg
	 * @param {types.Command} cmd
	 * @returns {Promise<boolean>}
	 */
	async authorizeCommand(msg, cmd) {
		const permission = this.permissionByCommandName.get(cmd.name)
		const group = this.groupByPermission.get(permission)

		// return true if: is cancel command, group is noAuth, chat is whitelisted
		if (cmd.name === CANCEL_COMMAND_NAME || group?.noAuth || this.commander.whitelistedChatIdSet?.has(msg.chat.id)) {
			return true
		}

		// return true if: no whitelist and no group (no whitelist = all unspecified commands are allowed)
		if (!this.commander.whitelistedChatIdSet && !group) {
			return true
		}

		// check permission
		if (permission) {
			const authorized = await this.useChatPermission(msg.chat.id, permission)
			if (authorized) {
				return true
			}
		}

		return false
	}

	/**
	 * Checks if the chat is authorized to call the command without consuming permission usage count.
	 * @param {Message} msg
	 * @param {types.Command} cmd
	 * @returns {Promise<boolean>}
	 */
	async isChatAuthorized(msg, cmd) {
		const permission = this.permissionByCommandName.get(cmd.name)
		const group = this.groupByPermission.get(permission)

		// return true if: is cancel command, group is noAuth, chat is whitelisted
		if (cmd.name === CANCEL_COMMAND_NAME || group?.noAuth || this.commander.whitelistedChatIdSet?.has(msg.chat.id)) {
			return true
		}

		// return true if: no whitelist and no group (no whitelist = all unspecified commands are allowed)
		if (!this.commander.whitelistedChatIdSet && !group) {
			return true
		}

		// check permission
		if (permission) {
			const chatPermission = await this.getChatPermission(msg.chat.id, permission)
			if (chatPermission?.usageCount === -1 || chatPermission?.usageCount > 0) {
				return true
			}
		}

		return false
	}

	/**
	 * @protected
	 * @param {Message} msg
	 * @param {types.Command} cmd
	 * @returns {Promise<void>}
	 */
	async beforeAuthorizeCommand(msg, cmd) {
		// no-op if command is already authorized
		const authorized = await this.isChatAuthorized(msg, cmd)
		if (authorized) return

		// check if command is approvable
		const permission = this.permissionByCommandName.get(cmd.name)
		const group = this.groupByPermission.get(permission)
		if (!group?.approvable) return

		// approval logic
		let approved = false
		await this.commander.newConversation(msg.chat.id, { type: types.ContextType.PERSISTENT }, async ctx => {
			const keyboardMsg = await ctx.reply(escapeMarkdownV2('You do not have permission to call this command. Do you want to ask for permission?'), { reply_markup: { inline_keyboard: [[
				{ text: 'Yes', callback_data: 'yes' },
				{ text: 'No', callback_data: 'no' }
			]]}})
			const query = await ctx.waitForCallbackQueryOnce(keyboardMsg)
			if (query.data === 'no') {
				await ctx.reply(escapeMarkdownV2('You can call this command again to ask for permission.'))
				return
			}
			await ctx.reply(escapeMarkdownV2('Asking for permission...'))

			// ask all approvers
			const group = this.groupByPermission.get(permission)
			const approverChatIds = group.approverChatIds ?? this.defaultApproverChatIds
			if (!approverChatIds?.length) {
				this.logger?.error(`CommandMonitor: no approvers available for permission ${permission}.`)
				await ctx.reply('No approvers available\\.')
				return
			}
			let chatName
			if (msg.chat.title) {
				chatName = `Group *${escapeMarkdownV2(msg.chat.title)}* \\(by \\@${escapeMarkdownV2(msg.from.username)}\\)`
			} else {
				chatName = `User \\@${escapeMarkdownV2(msg.from.username)}`
			}
			const reason = escapeMarkdownV2(`To call command /${cmd.name}`)
			let approvalResultResolve  // this is to notify the approver that the approval is done (by another approver)
			const approvalResultPromise = new Promise(resolve => approvalResultResolve = resolve)
			const approvalPromises = approverChatIds.map(approverChatId => this.startApprovalProcess(approverChatId, msg.chat.id, chatName, permission, reason, approvalResultPromise))
			const approvalResult = await Promise.race(approvalPromises)
			approvalResultResolve(approvalResult)

			switch (approvalResult) {
				case ApprovalResult.APPROVED:
					approved = true
					await ctx.reply('Permission granted\\.')
					break
				case ApprovalResult.JUST_THIS_TIME:
					approved = true
					await ctx.reply('Permission granted for this time only\\.')
					break
				case ApprovalResult.REJECTED:
					await ctx.reply('Permission rejected\\.')
					break
				default:
					throw new Error(`Unknown approval result: ${approvalResult}`)
			}
		})

		return approved
	}

	/**
	 * @protected
	 * @param {types.Command} cmd
	 * @returns {Promise<void>}
	 */
	async afterAddCommand(cmd) {
		for (const group of this.groups) {
			for (const cmdRegex of group.commandNames) {
				const regex = new RegExp(cmdRegex)
				if (!regex.test(cmd.name)) continue
				this.permissionByCommandName.set(cmd.name, group.permission)
				this.logger?.info(`CommandMonitor: command ${cmd.name} requires permission ${group.permission}.`)
				break
			}
		}
	}

	/**
	 * @param {number} approverChatId
	 * @param {number} approveeChatId
	 * @param {string} approvee
	 * @param {string} permission
	 * @param {string} reason
	 * @param {Promise<ApprovalResult>} [approvalPromise] This is used to notify the approver that the approval is done (by another approver).
	 * @returns {Promise<ApprovalResult>}
	 */
	async startApprovalProcess(approverChatId, approveeChatId, approvee, permission, reason = 'not specified', approvalPromise = undefined) {
		const group = this.groupByPermission.get(permission)
		/** @type {ApprovalResult} */
		let approvalResult = undefined

		const affectCommands = [ ...this.permissionByCommandName.entries() ].filter(([_, perm]) => perm === permission).map(([cmdName]) => `/${cmdName}`)
		await this.commander.newConversation(approverChatId, { type: types.ContextType.PERSISTENT }, async ctx => {
			const keyboardMsg = await ctx.reply([
				`\u{1F512} *Permission Request* \u{1F512}`,
				`Chat\\: ${approvee}`,
				`Chat ID\\: *${escapeMarkdownV2(approveeChatId + '')}*`,
				`Permission\\: *${permission}*`,
				`Reason\\: ${reason}`,
				escapeMarkdownV2(`Affected Commands: ${affectCommands.join(', ')}`),
				`Do you want to grant the permission\\?`
			], { reply_markup: { inline_keyboard: [[
				{ text: '\u2705 Approve', callback_data: ApprovalResult.APPROVED },
				{ text: '\u274C Reject', callback_data: ApprovalResult.REJECTED },
				{ text: '\u{1F44C} Just this time', callback_data: ApprovalResult.JUST_THIS_TIME },
			]]}})
			const queryPromise = ctx.waitForCallbackQueryOnce(keyboardMsg)
			const result = approvalPromise? await Promise.race([queryPromise, approvalPromise]) : await queryPromise
			if (typeof result === 'string') {
				// approval has been finished by other approver
				await ctx.reply(escapeMarkdownV2(`Approval has been done by other approver: ${result}.`))
				ctx.cancel()
				approvalResult = result

			} else {
				if (result.data === ApprovalResult.APPROVED) {
					this.grantChatPermission(approveeChatId, permission)
					await ctx.reply(`Permission *${permission}* granted to ${approvee} by \\@${result.from.username}\\.`)
				} else if (result.data === ApprovalResult.JUST_THIS_TIME) {
					this.grantChatPermission(approveeChatId, permission, 1)
					await ctx.reply(`Permission *${permission}* granted to ${approvee} for this time only by \\@${result.from.username}\\.`)
				} else {
					await ctx.reply(`Permission *${permission}* rejected by \\@${result.from.username}\\.`)
				}
				approvalResult = result.data
			}

		})
		return approvalResult
	}

	/**
	 * @param {number} chatId
	 * @param {string} permission
	 */
	parseChatPermissionKey(chatId, permission) {
		return `permission-${chatId}:${permission}`
	}

	/**
	 * @param {number} chatId
	 * @param {string} permission
	 * @param {number} [usageCount=-1] Number of times the permission can be used. -1 means unlimited.
	 */
	async grantChatPermission(chatId, permission, usageCount = -1) {
		if (usageCount === -1) {
			await this.setChatPermission(chatId, permission, usageCount)
		} else {
			const chatPermission = await this.getChatPermission(chatId, permission)
			await this.setChatPermission(chatId, permission, (chatPermission?.usageCount ?? 0) + usageCount)
		}
	}

	/**
	 * @param {number} chatId
	 * @param {string} permission
	 * @returns {Promise<boolean>}
	 */
	async useChatPermission(chatId, permission) {
		const chatPermission = await this.getChatPermission(chatId, permission)
		if (chatPermission === undefined) {
			return false
		} else if (chatPermission.usageCount === -1) {
			return true
		} else if (chatPermission.usageCount > 0) {
			chatPermission.usageCount--
			if (chatPermission.usageCount === 0) {
				await this.removeChatPermission(chatId, permission)
			} else {
				await this.setChatPermission(chatId, permission, chatPermission.usageCount)
			}
			return true
		} else {
			return false
		}
	}

	/**
	 * Get the number of times the permission can be used.
	 * @protected
	 * @param {number} chatId
	 * @param {string} permission
	 * @returns {Promise<ChatPermission>}
	 */
	async getChatPermission(chatId, permission) {
		const key = this.parseChatPermissionKey(chatId, permission)
		const val = await this.getStorage(key)
		return val
	}

	/**
	 * Set the number of times the permission can be used.
	 * @protected
	 * @param {number} chatId
	 * @param {string} permission
	 * @param {number} usageCount
	 */
	async setChatPermission(chatId, permission, usageCount) {
		const key = this.parseChatPermissionKey(chatId, permission)
		await this.setStorage(key, {
			usageCount
		})
		
	}

	/**
	 * Remove the chat permission.
	 * @protected
	 * @param {number} chatId
	 * @param {string} permission
	 */
	async removeChatPermission(chatId, permission) {
		const key = this.parseChatPermissionKey(chatId, permission)
		await this.removeStorage(key)
	}
}
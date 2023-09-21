import * as types from '../types.js'
import { escapeMarkdownV2 } from '../utils.js'
import TelegramCommanderPlugin from './base-plugin.js'
import { CANCEL_COMMAND_NAME } from '../telegram-commander.js'

/**
 * @typedef {import('winston').Logger} Logger
 * @typedef {import('node-telegram-bot-api').Message} Message
 * @typedef {import('../telegram-commander.js').default} TelegramCommander
 * 
 * @typedef CommandGroup
 * @property {string} permission
 * @property {string} description
 * @property {string[]} commandNames
 * @property {boolean} [approvable=true]
 * @property {boolean} [noAuth=false] If true, do not check for permission.
 * @property {number[]} [approverChatIds] If not set, use the defaultApproverChatIds.
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
	/** @protected @type {Logger} */					logger = undefined
	/** @protected @type {Map<number, Set<string>>} */	permissionSetByChatId = new Map()
	/** @protected @type {Set<string>} */				oneTimePermissionSet = new Set()

	/**
	 * @param {CommandGroup[]} groups
	 * @param {object} [opts={}]
 	 * @param {Logger} [opts.logger] If not set, use the logger from TelegramCommander.
	 * @param {number[]} [opts.defaultApproverChatIds] If not set, use the whitelistedChatIds from TelegramCommander.
	 */
	constructor(groups, opts = {}) {
		super()
		this.defaultApproverChatIds = opts?.defaultApproverChatIds ?? this.defaultApproverChatIds
		this.logger = opts?.logger ?? this.logger

		for (const group of groups) {
			group.approvable = group.approvable ?? true
			if (this.groupByPermission.has(group.permission)) {
				throw new Error(`Duplicated group permission: ${group.permission}`)
			}
			this.groupByPermission.set(group.permission, group)
			for (const cmdName of group.commandNames) {
				// throw error for cancel command
				if (cmdName === CANCEL_COMMAND_NAME) {
					throw new Error(`/cancel cannot have permission.`)
				}

				// check if same command appears in multiple groups
				if (this.permissionByCommandName.has(cmdName)) {
					throw new Error(`Duplicated command name: ${cmdName}`)
				}
				this.permissionByCommandName.set(cmdName, group.permission)
			}
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
		// TODO: if defaultApproverChatIds is not set, check if all groups have approverChatIds set
		// TODO: start command hide no auth + not approvable commands

		// override canHandleCommand
		this.bot.isChatAuthorized = this.isChatAuthorized.bind(this)
		// add beforeCommandHandler
		this.bot.beforeCommandHandlers.push(this.beforeCommandHandler.bind(this))
	}

	/**
	 * @param {Message} msg
	 * @param {types.Command} cmd
	 * @returns {Promise<boolean>}
	 */
	isChatAuthorized(msg, cmd) {
		const permission = this.permissionByCommandName.get(cmd.name)
		const group = this.groupByPermission.get(permission)
		const permissionSet = this.permissionSetByChatId.get(msg.chat.id)
		const oneTimePermission = this.oneTimePermissionSet.has(permission)
		// cancel command = allow
		// has group + noAuth/permission = allow
		// has one time permission = allow
		// has whitelist + in whitelist = allow
		// no whitelist + no group = allow
		// has whitelist + no group = deny
		// no whitelist + has group + no permission = deny
		return cmd.name === CANCEL_COMMAND_NAME ||
			group?.noAuth ||
			this.useOneTimePermission(msg.chat.id, permission) ||
			this.bot.whitelistedChatIdSet?.has(msg.chat.id) ||
			permissionSet?.has(permission) ||
			(!this.bot.whitelistedChatIdSet && !group)
	}

	/**
	 * @param {Message} msg
	 * @param {types.Command} cmd
	 * @returns {Promise<boolean>}
	 */
	async beforeCommandHandler(msg, cmd) {
		const permission = this.permissionByCommandName.get(cmd.name)
		const group = this.groupByPermission.get(permission)
		const permissionSet = this.permissionSetByChatId.get(msg.chat.id)
		// has group + noAuth, allow
		if (group?.noAuth) {
			return true
		} else if (this.bot.whitelistedChatIdSet) {
			// has whitelist + chat in whitelist, allow
			if (this.bot.whitelistedChatIdSet.has(msg.chat.id)) {
				return true
			// has whitelist + no group, deny
			} else if (permission === undefined) {
				return false
			// has whitelist + has group, check permission
			} else if (permissionSet?.has(permission)) {
				return true
			}
		// no whitelist + no group, allow
		} else if (!group) {
			return true
		// no whitelist + has group, check permission
		} else if (permissionSet?.has(permission)) {
			return true
		}

		// check if command is approvable
		if (!group.approvable) {
			return false
		}

		// approval logic
		let approved = false
		await this.bot.newConversation(msg.chat.id, { type: types.ContextType.PERSISTENT }, async ctx => {
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
			const approvalPromises = approverChatIds.map(approverChatId => this.askForApproval(approverChatId, msg.chat.id, chatName, permission, reason, approvalResultPromise))
			const approvalResult = await Promise.race(approvalPromises)
			approvalResultResolve(approvalResult)

			switch (approvalResult) {
				case ApprovalResult.APPROVED:
					approved = true
					this.addPermission(msg.chat.id, permission)
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
	 * @param {number} approverChatId
	 * @param {number} approveeChatId
	 * @param {string} approvee
	 * @param {string} permission
	 * @param {string} reason
	 * @param {Promise<ApprovalResult>} [approvalPromise] This is used to notify the approver that the approval is done (by another approver).
	 * @returns {Promise<ApprovalResult>}
	 */
	async askForApproval(approverChatId, approveeChatId, approvee, permission, reason = 'not specified', approvalPromise = undefined) {
		const group = this.groupByPermission.get(permission)
		/** @type {ApprovalResult} */
		let approvalResult = undefined

		await this.bot.newConversation(approverChatId, { type: types.ContextType.PERSISTENT }, async ctx => {
			const keyboardMsg = await ctx.reply([
				`\u{1F512} *Permission Request* \u{1F512}`,
				`Chat\\: ${approvee}`,
				`Chat ID\\: *${escapeMarkdownV2(approveeChatId + '')}*`,
				`Permission\\: *${permission}*`,
				`Reason\\: ${reason}`,
				escapeMarkdownV2(`Affected Commands: ${group.commandNames.map(n => '/' + n).join(', ')}`),
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
					this.addPermission(approveeChatId, permission)
					await ctx.reply(`Permission *${permission}* granted to ${approvee} by \\@${result.from.username}\\.`)
				} else if (result.data === ApprovalResult.JUST_THIS_TIME) {
					this.addOneTimePermission(approveeChatId, permission)
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
	addPermission(chatId, permission) {
		let permissionSet = this.permissionSetByChatId.get(chatId)
		if (!permissionSet) {
			permissionSet = new Set()
			this.permissionSetByChatId.set(chatId, permissionSet)
		}
		permissionSet.add(permission)
	}

	/**
	 * @param {number} chatId
	 * @param {string} permission
	 */
	addOneTimePermission(chatId, permission) {
		this.oneTimePermissionSet.add(`${chatId}-${permission}`)
	}

	/**
	 * @param {number} chatId
	 * @param {string} permission
	 * @returns {boolean}
	 */
	useOneTimePermission(chatId, permission) {
		if (this.oneTimePermissionSet.has(`${chatId}-${permission}`)) {
			this.oneTimePermissionSet.delete(`${chatId}-${permission}`)
			return true
		}
		return false
	}
}
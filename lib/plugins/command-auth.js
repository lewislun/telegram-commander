import * as types from '../types.js'
import { escapeMarkdownV2 } from '../utils.js'
import TelegramCommanderPlugin from './base-plugin.js'

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
			if (this.groupByPermission.has(group.permission)) {
				throw new Error(`Duplicated group permission: ${group.permission}`)
			}
			this.groupByPermission.set(group.permission, group)
			for (const cmdName of group.commandNames) {
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
		// TODO: override handleStartCommand

		// TODO: override canHandleCommand
		this.bot.canHandleCommand = this.canHandleCommand.bind(this)
	}

	/**
	 * @param {types.Command} cmd
	 * @param {Message} msg
	 * @returns {Promise<boolean>}
	 */
	async canHandleCommand(cmd, msg) {
		// original logic
		if (this.bot.whitelistedChatIdSet?.has(msg.chat.id) ?? true ) {
			return true
		}

		// check if chat has the permission to call the command
		const permission = this.permissionByCommandName.get(cmd.name)
		const permissionSet = this.permissionSetByChatId.get(msg.chat.id)
		if (!permission) {
			// command has no permission associated with it
			return false
		}
		if (permissionSet?.has(permission)) {
			return true
		}

		// check if command is approvable
		const group = this.groupByPermission.get(permission)
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
			let approveeName = `User \\@${escapeMarkdownV2(msg.from.username)}`
			if (msg.chat.title) {
				approveeName += ` from group *${msg.chat.title}*`
			}
			const reason = escapeMarkdownV2(`To call command /${cmd.name}`)
			const approvalPromises = approverChatIds.map(approverChatId => this.askForApproval(approverChatId, msg.chat.id, approveeName, permission, reason))
			const approvalResult = await Promise.race(approvalPromises)

			switch (approvalResult) {
				case ApprovalResult.APPROVED:
					approved = true
					this.addPermission(msg.chat.id, permission)
					await ctx.reply('Permission granted\\.')
					break
				case ApprovalResult.JUST_THIS_TIME:
					approved = true
					await ctx.reply('Permission granted for this time\\.')
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
	 * @param {string} approveeName
	 * @param {string} permission
	 * @param {string} reason
	 * @returns {Promise<ApprovalResult>}
	 */
	async askForApproval(approverChatId, approveeChatId, approveeName, permission, reason = 'not specified') {
		const group = this.groupByPermission.get(permission)
		/** @type {ApprovalResult} */
		let approvalResult = undefined

		await this.bot.newConversation(approverChatId, { type: types.ContextType.PERSISTENT }, async ctx => {
			const keyboardMsg = await ctx.reply([
				`\u{1F512} *Permission Request* \u{1F512}`,
				`Approvee\\: ${approveeName}`,
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
			// TODO: intercept (other approver)
			const query = await ctx.waitForCallbackQueryOnce(keyboardMsg)

			if (query.data === ApprovalResult.APPROVED) {
				this.addPermission(approveeChatId, permission)
				await ctx.reply(escapeMarkdownV2(`Permission *${permission}* granted to ${approveeName}.`))
			} else if (query.data === ApprovalResult.JUST_THIS_TIME) {
				await ctx.reply(escapeMarkdownV2(`Permission *${permission}* granted to ${approveeName} for this time only.`))
			} else {
				await ctx.reply(escapeMarkdownV2(`Permission *${permission}* rejected.`))
			}

			approvalResult = query.data
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
}
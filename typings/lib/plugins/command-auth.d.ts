export type ApprovalResult = string;
export namespace ApprovalResult {
    let APPROVED: string;
    let REJECTED: string;
    let JUST_THIS_TIME: string;
}
export default class CommandAuth extends TelegramCommanderPlugin {
    /**
     * @param {CommandGroup[]} groups
     * @param {object} [opts={}]
     * @param {Logger} [opts.logger] If not set, use the logger from TelegramCommander.
     * @param {number[]} [opts.defaultApproverChatIds] If not set, use the whitelistedChatIds from TelegramCommander.
     * @param {StorageConfig} [opts.storage] Persistent storage for permissions. If not set, use in-memory storage.
     */
    constructor(groups: CommandGroup[], opts?: {
        logger?: Logger;
        defaultApproverChatIds?: number[];
        storage?: StorageConfig;
    });
    /** @type {Map<string, CommandGroup>} */ groupByPermission: Map<string, CommandGroup>;
    /** @type {Map<string, string} */ permissionByCommandName: Map<string, string>;
    /** @type {number[]} */ defaultApproverChatIds: number[];
    /** @type {CommandGroup[]} */ groups: CommandGroup[];
    /** @protected @type {Logger} */ protected logger: Logger;
    /** @protected @type {Map<string, number>} */ protected usageCountByChatPermission: Map<string, number>;
    /**
     * @param {TelegramCommander} bot
     */
    init(bot: TelegramCommander): void;
    /**
     * Checks if the chat is authorized to call the command and CONSUME permission usage count if needed.
     * @param {Message} msg
     * @param {types.Command} cmd
     * @returns {Promise<boolean>}
     */
    authorizeCommand(msg: Message, cmd: types.Command): Promise<boolean>;
    /**
     * Checks if the chat is authorized to call the command without consuming permission usage count.
     * @param {Message} msg
     * @param {types.Command} cmd
     * @returns {Promise<boolean>}
     */
    isChatAuthorized(msg: Message, cmd: types.Command): Promise<boolean>;
    /**
     * @protected
     * @param {Message} msg
     * @param {types.Command} cmd
     * @returns {Promise<void>}
     */
    protected beforeAuthorizeCommand(msg: Message, cmd: types.Command): Promise<void>;
    /**
     * @protected
     * @param {types.Command} cmd
     * @returns {Promise<void>}
     */
    protected afterAddCommand(cmd: types.Command): Promise<void>;
    /**
     * @param {number} approverChatId
     * @param {number} approveeChatId
     * @param {string} approvee
     * @param {string} permission
     * @param {string} reason
     * @param {Promise<ApprovalResult>} [approvalPromise] This is used to notify the approver that the approval is done (by another approver).
     * @returns {Promise<ApprovalResult>}
     */
    startApprovalProcess(approverChatId: number, approveeChatId: number, approvee: string, permission: string, reason?: string, approvalPromise?: Promise<ApprovalResult>): Promise<ApprovalResult>;
    /**
     * @param {number} chatId
     * @param {string} permission
     */
    parseChatPermissionKey(chatId: number, permission: string): string;
    /**
     * @param {number} chatId
     * @param {string} permission
     * @param {number} [usageCount=-1] Number of times the permission can be used. -1 means unlimited.
     */
    grantChatPermission(chatId: number, permission: string, usageCount?: number): Promise<void>;
    /**
     * @param {number} chatId
     * @param {string} permission
     * @returns {Promise<boolean>}
     */
    useChatPermission(chatId: number, permission: string): Promise<boolean>;
    /**
     * Get the number of times the permission can be used.
     * @protected
     * @param {number} chatId
     * @param {string} permission
     * @returns {Promise<ChatPermission>}
     */
    protected getChatPermission(chatId: number, permission: string): Promise<ChatPermission>;
    /**
     * Set the number of times the permission can be used.
     * @protected
     * @param {number} chatId
     * @param {string} permission
     * @param {number} usageCount
     */
    protected setChatPermission(chatId: number, permission: string, usageCount: number): Promise<void>;
    /**
     * Remove the chat permission.
     * @protected
     * @param {number} chatId
     * @param {string} permission
     */
    protected removeChatPermission(chatId: number, permission: string): Promise<void>;
}
export type Logger = import('winston').Logger;
export type Message = import('node-telegram-bot-api').Message;
export type TelegramCommanderOptions = import('../telegram-commander.js').default;
export type StorageConfig = import('./base-plugin.js').StorageConfig;
export type CommandGroup = {
    permission: string;
    description: string;
    commandNames: (string | RegExp)[];
    approvable?: boolean;
    /**
     * If true, do not check for permission.
     */
    noAuth?: boolean;
    /**
     * If not set, use the defaultApproverChatIds.
     */
    approverChatIds?: number[];
};
export type ChatPermission = {
    usageCount: number;
};
import TelegramCommanderPlugin from './base-plugin.js';
import * as types from '../types.js';

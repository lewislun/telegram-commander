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
     */
    constructor(groups: CommandGroup[], opts?: {
        logger?: Logger;
        defaultApproverChatIds?: number[];
    });
    /** @type {Map<string, CommandGroup>} */ groupByPermission: Map<string, CommandGroup>;
    /** @type {Map<string, string} */ permissionByCommandName: Map<string, string>;
    /** @type {number[]} */ defaultApproverChatIds: number[];
    /** @protected @type {Logger} */ protected logger: Logger;
    /** @protected @type {Map<number, Set<string>>} */ protected permissionSetByChatId: Map<number, Set<string>>;
    /**
     * @param {TelegramCommander} bot
     */
    init(bot: TelegramCommander): void;
    /**
     * @param {types.Command} cmd
     * @param {Message} msg
     * @returns {Promise<boolean>}
     */
    canHandleCommand(cmd: types.Command, msg: Message): Promise<boolean>;
    /**
     * @param {number} approverChatId
     * @param {number} approveeChatId
     * @param {string} approvee
     * @param {string} permission
     * @param {string} reason
     * @param {Promise<ApprovalResult>} [approvalPromise] This is used to notify the approver that the approval is done (by another approver).
     * @returns {Promise<ApprovalResult>}
     */
    askForApproval(approverChatId: number, approveeChatId: number, approvee: string, permission: string, reason?: string, approvalPromise?: Promise<ApprovalResult>): Promise<ApprovalResult>;
    /**
     * @param {number} chatId
     * @param {string} permission
     */
    addPermission(chatId: number, permission: string): void;
}
export type Logger = import('winston').Logger;
export type Message = import('node-telegram-bot-api').Message;
export type TelegramCommander = import('../telegram-commander.js').default;
export type CommandGroup = {
    permission: string;
    description: string;
    commandNames: string[];
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
import TelegramCommanderPlugin from './base-plugin.js';
import * as types from '../types.js';

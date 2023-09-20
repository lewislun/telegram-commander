export default class TelegramCommander extends TelegramBot {
    /**
     * @param {string} token
     * @param {types.TelegramCommanderOptions} [opts={}]
     */
    constructor(token: string, opts?: types.TelegramCommanderOptions);
    /** @type {Logger|Console} */ logger: Logger | Console;
    /** @type {Set<number>} */ whitelistedChatIdSet: Set<number>;
    /** @type {Map<string, types.Command>} */ commandByName: Map<string, types.Command>;
    /** @type {ParseMode} */ defaultParseMode: ParseMode;
    /** @type {boolean} */ errorReplyEnabled: boolean;
    /** @type {User} */ botUser: User;
    /** @protected @type {ContextManager} */ protected contextManager: ContextManager;
    /** @protected @type {ReplyListenerRegistry} */ protected replyListenerRegistry: ReplyListenerRegistry;
    /**
     * Get all registered commands, with /cancel at the end.
     * @returns {types.Command[]}
     */
    get commands(): types.Command[];
    /**
     * @param {Context} ctx
     */
    handleStartCommand(ctx: Context): Promise<void>;
    /**
     * @param {number} chatId
     * @returns {boolean}
     */
    isChatIdWhitelisted(chatId: number): boolean;
    /**
     * @private
     * @param {Context} ctx
     */
    private handleCancelCommand;
    /**
     * @private
     * @param {Message} msg
     */
    private handleCommand;
    /**
     * @param {types.Command} cmd
     */
    addCommand(cmd: types.Command): void;
    /**
     * Sync commands with telegram. Commands will be shown in the command list in the chat with the bot.
     * Commands with params will not be synced. (since clicking on the command list will instantly send the command without params in Telegram)
     */
    syncCommands(): Promise<void>;
    /**
     * @param {number|number[]} chatIds
     * @param {string|string[]} content
     * @param {SendMessageOptions} [opts={}]
     * @returns {Promise<Message[]>}
     */
    sendMessage(chatIds: number | number[], content: string | string[], opts?: SendMessageOptions): Promise<Message[]>;
    /**
     * @param {number} chatId
     * @param {object} [opts={}]
     * @param {types.ContextType} [opts.type='linear']
     * @param {number} [opts.targetUserId] If specified, only replies from this user will be handled.
     * @param {(ctx: Context) => Promise<void>} handler
     */
    newConversation(chatId: number, opts?: {
        type?: types.ContextType;
        targetUserId?: number;
    }, handler: (ctx: Context) => Promise<void>): Promise<void>;
}
export type Logger = import('winston').Logger;
export type SendMessageOptions = import('node-telegram-bot-api').SendMessageOptions;
export type ParseMode = import('node-telegram-bot-api').ParseMode;
export type Message = import('node-telegram-bot-api').Message;
export type User = import('node-telegram-bot-api').User;
import TelegramBot from 'node-telegram-bot-api';
import * as types from './types.js';
import ContextManager from './context-manager.js';
import ReplyListenerRegistry from './reply-listener-registry.js';
import Context from './context.js';

/**
 * @typedef {import('winston').Logger} Logger
 * @typedef {import('node-telegram-bot-api').SendMessageOptions} SendMessageOptions
 * @typedef {import('node-telegram-bot-api').ParseMode} ParseMode
 * @typedef {import('node-telegram-bot-api').Message} Message
 * @typedef {import('node-telegram-bot-api').User} User
 * @typedef {import('./plugins').TelegramCommanderPlugin} TelegramCommanderPlugin
 */
export const START_COMMAND_NAME: "start";
export const CANCEL_COMMAND_NAME: "cancel";
export default class TelegramCommander {
    /**
     * @param {string} token
     * @param {types.TelegramCommanderOptions} [opts={}]
     */
    constructor(token: string, opts?: types.TelegramCommanderOptions);
    /** @type {import('node-telegram-bot-api')} */ bot: import('node-telegram-bot-api');
    /** @type {Logger|Console} */ logger: Logger | Console;
    /** @type {Set<number>} */ whitelistedChatIdSet: Set<number>;
    /** @type {Map<string, types.Command>} */ commandByName: Map<string, types.Command>;
    /** @type {ParseMode} */ defaultParseMode: ParseMode;
    /** @type {boolean} */ errorReplyEnabled: boolean;
    /** @type {User} */ botUser: User;
    /** @type {TelegramCommanderPlugin[]} */ plugins: TelegramCommanderPlugin[];
    /** @type {((msg: Message, cmd: types.Command) => Promise<void>)[]} */ beforeAuthorizeCommandHooks: ((msg: Message, cmd: types.Command) => Promise<void>)[];
    /** @type {((cmd: types.Command) => Promise<void>)[]} */ afterAddCommandHooks: ((cmd: types.Command) => Promise<void>)[];
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
     * @private
     * @param {Context} ctx
     */
    private handleCancelCommand;
    /**
     * @param {Message} msg
     * @param {types.Command} cmd
     * @returns {Promise<boolean>}
     */
    authorizeCommand(msg: Message, cmd: types.Command): Promise<boolean>;
    /**
     * @private
     * @param {Message} msg
     */
    private handleCommand;
    /**
     * @param {types.Command} cmd
     */
    addCommand(cmd: types.Command): Promise<void>;
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
export type TelegramCommanderPlugin = import('./plugins').TelegramCommanderPlugin;
import * as types from './types.js';
import ContextManager from './context-manager.js';
import ReplyListenerRegistry from './reply-listener-registry.js';
import Context from './context.js';

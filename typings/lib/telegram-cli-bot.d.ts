export default class TelegramCliBot extends TelegramBot {
    /**
     * @param {string} token
     * @param {TelegramCliBotOptions} [opts={}]
     */
    constructor(token: string, opts?: TelegramCliBotOptions);
    /** @type {Logger} */ logger: Logger;
    /** @type {Set<number>} */ whitelistedChatIdSet: Set<number>;
    /** @type {Map<string, Command>} */ commandByName: Map<string, Command>;
    /** @type {ContextManager} */ contextManager: ContextManager;
    /**
     * Get all registered commands, with /cancel at the end.
     * @returns {Command[]}
     */
    get commands(): import("./types.js").Command[];
    /**
     * @param {number[]|number} chatIds
     */
    sendCommandInfos(chatIds: number[] | number): Promise<void>;
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
     * @returns {Promise<boolean>} true if the message is handled by a context
     */
    private handleContextReply;
    /**
     * @private
     * @param {Message} msg
     */
    private handleCommand;
    /**
     * @param {Command} cmd
     */
    addCommand(cmd: Command): void;
    /**
     * Sync commands with telegram. Commands will be shown in the command list in the chat with the bot.
     */
    syncCommands(): Promise<void>;
    /**
     * @param {number|number[]} chatIds
     * @param {string|string[]} content
     * @param {SendMessageOptions} [opts={}]
     * @returns {Promise<Message[]>}
     */
    sendMessage(chatIds: number | number[], content: string | string[], opts?: SendMessageOptions): Promise<Message[]>;
}
export type Logger = import('winston').Logger;
export type SendMessageOptions = import('node-telegram-bot-api').SendMessageOptions;
export type Message = import('node-telegram-bot-api').Message;
export type Command = import('./types.js').Command;
export type CommandHandler = import('./types.js').CommandHandler;
export type TelegramCliBotOptions = import('./types.js').TelegramCliBotOptions;
import TelegramBot from 'node-telegram-bot-api';
import ContextManager from './context-manager.js';

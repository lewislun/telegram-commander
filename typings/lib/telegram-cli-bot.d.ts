export default class TelegramCliBot extends TelegramBot {
    /**
     * @param {string} token
     * @param {types.TelegramCliBotOptions} [opts={}]
     */
    constructor(token: string, opts?: types.TelegramCliBotOptions);
    /** @type {Logger} */ logger: Logger;
    /** @type {Set<number>} */ whitelistedChatIdSet: Set<number>;
    /** @type {Map<string, types.Command>} */ commandByName: Map<string, types.Command>;
    /** @type {ContextManager} */ contextManager: ContextManager;
    /**
     * Get all registered commands, with /cancel at the end.
     * @returns {types.Command[]}
     */
    get commands(): types.Command[];
    /**
     * @param {number[]|number} chatIds
     */
    handleStartCommand(chatIds: number[] | number): Promise<void>;
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
     * @param {types.Command} cmd
     */
    addCommand(cmd: types.Command): void;
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
import TelegramBot from 'node-telegram-bot-api';
import * as types from './types.js';
import ContextManager from './context-manager.js';

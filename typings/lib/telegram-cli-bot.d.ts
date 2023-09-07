/**
 * @typedef {import('winston').Logger} Logger
 * @typedef {import('node-telegram-bot-api').SendMessageOptions} SendMessageOptions
 * @typedef {import('node-telegram-bot-api').Message} Message
 * @typedef {import('./types.js').Command} Command
 * @typedef {import('./types.js').CommandHandler} CommandHandler
 * @typedef {import('./types.js').TelegramCliBotOptions} TelegramCliBotOptions
 */
export default class TelegramCliBot {
    /**
     * @param {string} token
     * @param {TelegramCliBotOptions} [opts={}]
     */
    constructor(token: string, opts?: TelegramCliBotOptions);
    /** @type {Logger} */ logger: Logger;
    /** @type {Command[]} */ commands: Command[];
    /** @type {Set<number>} */ whitelistedChatIdSet: Set<number>;
    sendCommandInfos(chatId: any): Promise<void>;
    /**
     * @param {number} chatId
     * @returns {boolean}
     */
    isChatIdWhitelisted(chatId: number): boolean;
    /**
     * @param {Command} cmd
     */
    addCommand(cmd: Command): void;
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

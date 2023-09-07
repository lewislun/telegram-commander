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
    /** @type {TelegramBot} */ bot: TelegramBot;
    /** @type {Command[]} */ commands: Command[];
    sendCommandInfos(chatId: any): Promise<void>;
    /**
     * @param {string} name
     * @param {CommandHandler} handler
     * @param {string[]} [argNames]
     * @param {string} [description]
     */
    addCommand(name: string, argNames?: string[], description?: string, handler: CommandHandler): Promise<void>;
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

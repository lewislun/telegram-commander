/**
 * @typedef {import('node-telegram-bot-api').SendMessageOptions} SendMessageOptions
 * @typedef {import('node-telegram-bot-api').Message} Message
 * @typedef {import('node-telegram-bot-api').CallbackQuery} CallbackQuery
 * @typedef {import('./telegram-commander.js').TelegramCommander} TelegramCliBot
 * @typedef {import('./types.js').Command} Command
 */
export default class Context {
    /**
     * @param {TelegramCliBot} bot
     * @param {Command} commandName
     * @param {Message} msg
     * @param {string[]} [args]
     */
    constructor(bot: any, command: any, msg: Message, args?: string[]);
    /** @type {TelegramCliBot} */ bot: any;
    /** @type {Command} */ command: Command;
    /** @type {Message} */ msg: Message;
    /** @type {Context|undefined} */ prevContext: Context | undefined;
    /** @private @type {(Message) => void} */ private messageResolve;
    /** @private @type {(Error) => void} */ private messageReject;
    /** @private @type {(Error) => void} */ private callbackQueryReject;
    args: string[];
    /**
     * @returns {boolean}
     */
    get isWaitingForMessage(): boolean;
    /**
     * @param {string|string[]} content
     * @param {SendMessageOptions} [opts={}]
     * @returns {Promise<Message>}
     */
    reply(content: string | string[], opts?: SendMessageOptions): Promise<Message>;
    /**
     * Wait for a message from the same user in the same chat.
     * CAUTION: to read message from groups, talk to \@BotFather and disable privacy mode.
     * @see https://core.telegram.org/bots#privacy-mode
     * @returns {Promise<Message>}
     */
    waitForMessage(): Promise<Message>;
    /**
     * Wait for callback query (a.k.a. inline keyboard button click).
     * @see https://core.telegram.org/bots/api#callbackquery
     * @param {Message} inlineKeyboardMsg The message that contains the inline keyboard.
     * @param {types.WaitForCallbackQueryOnceOptions} [opts={}]
     */
    waitForCallbackQueryOnce(inlineKeyboardMsg: Message, opts?: types.WaitForCallbackQueryOnceOptions): Promise<import("node-telegram-bot-api").CallbackQuery>;
    /**
     * Receive message from the same user in the same chat. This is called by TelegramCliBot.
     * @param {Message} msg
     * @throws {Error} if not waiting for message
     */
    receiveMessage(msg: Message): void;
    /**
     * Cancel the context. This is called by TelegramCliBot.
     */
    cancel(): void;
}
export type SendMessageOptions = import('node-telegram-bot-api').SendMessageOptions;
export type Message = import('node-telegram-bot-api').Message;
export type CallbackQuery = import('node-telegram-bot-api').CallbackQuery;
export type TelegramCliBot = import('./telegram-commander.js').TelegramCommander;
export type Command = import('./types.js').Command;
import * as types from './types.js';

export default class Context {
    /**
     * @param {TelegramCommander} bot
     * @param {Command} commandName
     * @param {Message} msg
     * @param {string[]} [args]
     */
    constructor(bot: TelegramCommander, command: any, msg: Message, args?: string[]);
    /** @readonly @type {number} */ readonly id: number;
    /** @type {types.ContextType} */ type: types.ContextType;
    /** @type {number} */ targetUserId: number;
    /** @type {TelegramCommander} */ bot: TelegramCommander;
    /** @type {Command} */ command: Command;
    /** @type {Message} */ msg: Message;
    /** @type {string[]} */ args: string[];
    /** @type {Context|undefined} */ prevContext: Context | undefined;
    /** @private @type {(Error) => void} */ private messageReject;
    /** @private @type {(Error) => void} */ private callbackQueryReject;
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
     * Cancel the context.
     */
    cancel(): void;
}
export type SendMessageOptions = import('node-telegram-bot-api').SendMessageOptions;
export type Message = import('node-telegram-bot-api').Message;
export type CallbackQuery = import('node-telegram-bot-api').CallbackQuery;
export type TelegramCommander = import('./telegram-commander.js').default;
export type Command = import('./types.js').Command;
import * as types from './types.js';

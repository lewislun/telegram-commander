export default class Context {
    /**
     * @param {TelegramCommander} bot
     * @param {Command} command
     * @param {Message} msg
     * @param {string[]} [args]
     * @returns {Context}
     */
    static fromCommand(bot: TelegramCommander, command: Command, msg: Message, args?: string[]): Context;
    static getConversationId(chatId: any, targetUserId: any): string;
    /**
     * @param {TelegramCommander} bot
     * @param {number} chatId
     * @param {object} [opts={}]
     * @param {types.ContextType} [opts.type='linear']
     * @param {number} [opts.targetUserId]
     */
    constructor(bot: TelegramCommander, chatId: number, opts?: {
        type?: types.ContextType;
        targetUserId?: number;
    });
    /** @readonly @type {number} */ readonly id: number;
    /** @type {types.ContextType} */ type: types.ContextType;
    /** @type {TelegramCommander} */ commander: TelegramCommander;
    /** @type {number} */ chatId: number;
    /** @type {Command} */ command: Command;
    /** @type {Message} */ triggerMsg: Message;
    /** @type {number} */ targetUserId: number;
    /** @type {string[]} */ args: string[];
    /** @type {Context|undefined} */ prevContext: Context | undefined;
    /** @private @type {(Error) => void} */ private messageReject;
    /** @private @type {(Error) => void} */ private callbackQueryReject;
    get conversationId(): string;
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
     * @returns {Promise<CallbackQuery>}
     */
    waitForCallbackQueryOnce(inlineKeyboardMsg: Message, opts?: types.WaitForCallbackQueryOnceOptions): Promise<CallbackQuery>;
    /**
     * Prompt the user for a text input. It accepts both inline keyboard or text input, which ever comes first.
     * This is a wrapper around reply(), waitForMessage() and waitForCallbackQueryOnce().
     * @param {string|string[]} content
     * @param {SendMessageOptions & PromptOptions} [opts={}]
     * @returns {Promise<string>}
     */
    prompt(content: string | string[], opts?: SendMessageOptions & PromptOptions): Promise<string>;
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
export type PromptOptions = {
    /**
     * If false, text input will be ignored (only inline keyboard input will be accepted).
     */
    isManualInputEnabled?: boolean;
    errorMsg?: string | ((result: string) => string);
    validator?: (result: string) => boolean;
    /**
     * If defined, the prompt text will change to this text after the user has entered a valid input.
     */
    promptTextOnDone?: (result: string) => string;
};
import * as types from './types.js';

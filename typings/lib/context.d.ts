/**
 * @typedef {import('node-telegram-bot-api').SendMessageOptions} SendMessageOptions
 * @typedef {import('node-telegram-bot-api').Message} Message
 * @typedef {import('./telegram-cli-bot').default} TelegramCliBot
 * @typedef {import('./types.js').Command} Command
 */
export default class Context {
    /**
     * @param {TelegramCliBot} bot
     * @param {Command} commandName
     * @param {Message} msg
     * @param {string[]} [args]
     */
    constructor(bot: TelegramCliBot, command: any, msg: Message, args?: string[]);
    /** @type {TelegramCliBot} */ bot: TelegramCliBot;
    /** @type {Command} */ command: Command;
    /** @type {Message} */ msg: Message;
    /** @type {(Message) => void} */ messageResolve: (Message: any) => void;
    /** @type {Context|undefined} */ prevContext: Context | undefined;
    args: string[];
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
     *
     * @returns {Promise<Message>}
     */
    waitForMessage(): Promise<Message>;
}
export type SendMessageOptions = import('node-telegram-bot-api').SendMessageOptions;
export type Message = import('node-telegram-bot-api').Message;
export type TelegramCliBot = import('./telegram-cli-bot').default;
export type Command = import('./types.js').Command;

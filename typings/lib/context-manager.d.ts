/**
 * @typedef {import('node-telegram-bot-api').Message} Message
 * @typedef {import('./telegram-cli-bot').default} TelegramCliBot
 * @typedef {import('./types.js').Command} Command
 */
export default class ContextManager {
    /** @type {Map<string, Context>} */ contextBySource: Map<string, Context>;
    /**
     * @param {Message} msg
     * @returns {string}
     */
    getSource(msg: Message): string;
    /**
     * @param {Message} msg
     * @returns {Context|undefined}
     */
    get(msg: Message): Context | undefined;
    /**
     * @param {Context} context
     */
    set(context: Context): void;
    /**
     * @param {Message|Context} msgOrContext
     */
    delete(msgOrContext: Message | Context): void;
    /**
     * @param {TelegramCliBot} bot
     * @param {Command} commandName
     * @param {Message} msg
     * @param {string[]} [args]
     * @returns {Context}
     */
    new(bot: TelegramCliBot, command: any, msg: Message, args?: string[]): Context;
}
export type Message = import('node-telegram-bot-api').Message;
export type TelegramCliBot = import('./telegram-cli-bot').default;
export type Command = import('./types.js').Command;
import Context from './context.js';

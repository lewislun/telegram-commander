/**
 * @typedef {import('node-telegram-bot-api').Message} Message
 * @typedef {import('./telegram-commander.js').default} TelegramCommander
 */
export default class ContextManager {
    /** @type {Map<string, Context>} */ contextBySource: Map<string, Context>;
    /**
     * @private
     * @param {Message} msg
     * @returns {string}
     */
    private getSource;
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
     * @param {TelegramCommander} bot
     * @param {types.Command} commandName
     * @param {Message} msg
     * @param {string[]} [args]
     * @returns {Context}
     */
    new(bot: TelegramCommander, command: any, msg: Message, args?: string[]): Context;
}
export type Message = import('node-telegram-bot-api').Message;
export type TelegramCommander = import('./telegram-commander.js').default;
import Context from './context.js';

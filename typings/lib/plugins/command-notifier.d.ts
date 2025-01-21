/**
 * @typedef {import('node-telegram-bot-api').Message} Message
 * @typedef {import('../telegram-commander.js').default} TelegramCommander
 */
export default class CommandNotifier extends TelegramCommanderPlugin {
    /**
     * @param {number[]} chatIds
     */
    constructor(chatIds: number[]);
    /** @type {number[]} */ chatIds: number[];
    /**
     * @param {TelegramCommander} bot
     */
    init(bot: TelegramCommander): void;
    /**
     * @param {Context} ctx
     * @returns {Promise<void>}
     */
    beforeHandleCommand(ctx: Context): Promise<void>;
}
export type Message = import('node-telegram-bot-api').Message;
export type TelegramCommander = import('../telegram-commander.js').default;
import TelegramCommanderPlugin from './base-plugin.js';
import Context from '../context.js';

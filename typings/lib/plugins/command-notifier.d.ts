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
     * @protected
     * @param {Message} msg
     * @param {types.Command} cmd
     * @returns {Promise<void>}
     */
    protected beforeAuthorizeCommand(msg: Message, cmd: types.Command): Promise<void>;
}
export type Message = import('node-telegram-bot-api').Message;
export type TelegramCommander = import('../telegram-commander.js').default;
import TelegramCommanderPlugin from './base-plugin.js';
import * as types from '../types.js';

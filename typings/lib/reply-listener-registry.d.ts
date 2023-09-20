/**
 * @typedef {import('./context.js').default} Context
 * @typedef {import('node-telegram-bot-api').Message} Message
 * @typedef {import('node-telegram-bot-api').CallbackQuery} CallbackQuery
 */
export default class ReplyListenerRegistry {
    /** @type {number} */ nextListenerId: number;
    /** @type {Map.<string, Map<number, types.CallbackQueryListener>>} */ queryListenerByIdByMsgIdentifier: Map<string, Map<number, types.CallbackQueryListener>>;
    /** @type {Map.<number, string>} */ fullMsgIdByQueryListenerId: Map<number, string>;
    /** @type {Map.<number, Map<number, types.MessageListener>>} */ msgListenerByIdByChatId: Map<number, Map<number, types.MessageListener>>;
    /** @type {Map.<number, number>} */ chatIdByMsgListenerId: Map<number, number>;
    /**
     * A unique identifier for a message.
     *
     * @private
     * @param {Message} msg
     * @returns {string}
     */
    private getFullMsgId;
    /**
     * @param {number} chatId
     * @param {number} count
     * @param {number} [targetUserId=undefined] If defined, only the user with this id can trigger the listener.
     * @param {(msg: Message) => Promise<void>} handler
     * @returns {types.MessageListener}
     */
    registerMsgListener(chatId: number, count: number, targetUserId?: number, handler: (msg: Message) => Promise<void>): types.MessageListener;
    /**
     * @param {Message} inlineKeyboardMsg
     * @param {number} count
     * @param {number} [targetUserId=undefined] If defined, only the user with this id can trigger the listener.
     * @param {(query: CallbackQuery) => Promise<void>} handler
     * @returns {types.CallbackQueryListener}
     */
    registerCallbackQueryListener(inlineKeyboardMsg: Message, count: number, targetUserId?: number, handler: (query: CallbackQuery) => Promise<void>): types.CallbackQueryListener;
    /**
     * @param {number} listenerId
     * @returns {boolean}
     */
    unregisterListener(listenerId: number): boolean;
    /**
     * @param {CallbackQuery} query
     */
    handleCallbackQuery(query: CallbackQuery): Promise<void>;
    /**
     * @param {Message} msg
     */
    handleMessage(msg: Message): Promise<void>;
}
export type Context = import('./context.js').default;
export type Message = import('node-telegram-bot-api').Message;
export type CallbackQuery = import('node-telegram-bot-api').CallbackQuery;
import * as types from './types.js';

/**
 * @typedef {import('node-telegram-bot-api').Message} Message
 * @typedef {import('node-telegram-bot-api').CallbackQuery} CallbackQuery
 */
export default class ReplyListenerRegistry {
    /** @type {Map.<string, Map<number, types.CallbackQueryListener>>} */ queryListenerByIdByMsgIdentifier: Map<string, Map<number, types.CallbackQueryListener>>;
    /** @type {Map.<number, string>} */ msgIdentifierByQueryListenerId: Map<number, string>;
    /** @type {number} */ nextListenerId: number;
    /**
     * @private
     * @param {Message} msg
     * @returns {string}
     */
    private getMsgIdentifier;
    /**
     *
     * @param {Message} inlineKeyboardMsg
     * @param {number} count
     * @param {number} [cmdCallerId=undefined]
     * @param {(CallbackQuery) => Promise<types.CallbackQueryListener>} handler
     * @returns {types.CallbackQueryListener}
     */
    registerCallbackQueryListener(inlineKeyboardMsg: Message, count: number, cmdCallerId?: number, handler: (CallbackQuery: any) => Promise<types.CallbackQueryListener>): types.CallbackQueryListener;
    /**
     * @param {number} listenerId
     * @returns {boolean}
     */
    unregisterCallbackQueryListener(listenerId: number): boolean;
    /**
     * @param {CallbackQuery} query
     */
    handleCallbackQuery(query: CallbackQuery): Promise<void>;
}
export type Message = import('node-telegram-bot-api').Message;
export type CallbackQuery = import('node-telegram-bot-api').CallbackQuery;
import * as types from './types.js';

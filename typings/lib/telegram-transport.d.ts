/**
 * @typedef {import('./telegram-commander.js').TelegramCommander} TelegramCliBot
 */
export default class TelegramBotTransport extends Transport {
    /**
     * @param {TelegramCliBot} bot
     * @param {number[]} chatIds
     * @param {object} [opts={}]
     * @param {Transport.TransportStreamOptions} [opts.transportOpts]
     */
    constructor(bot: any, chatIds: number[], opts?: {
        transportOpts?: Transport.TransportStreamOptions;
    });
    /** @type {TelegramCliBot} */ bot: any;
    /** @type {number[]} */ chatIds: number[];
    /**
     * @param {*} info
     * @param {function} next
     */
    log(info: any, next: Function): void;
}
export type TelegramCliBot = import('./telegram-commander.js').TelegramCommander;
import Transport from 'winston-transport';

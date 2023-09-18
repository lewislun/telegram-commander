/**
 * @typedef {import('./telegram-commander.js').default} TelegramCommander
 */
export default class TelegramBotTransport extends Transport {
    /**
     * @param {TelegramCommander} bot
     * @param {number[]} chatIds
     * @param {object} [opts={}]
     * @param {Transport.TransportStreamOptions} [opts.transportOpts]
     */
    constructor(bot: TelegramCommander, chatIds: number[], opts?: {
        transportOpts?: Transport.TransportStreamOptions;
    });
    /** @type {TelegramCommander} */ bot: TelegramCommander;
    /** @type {number[]} */ chatIds: number[];
    /**
     * @param {*} info
     * @param {function} next
     */
    log(info: any, next: Function): void;
}
export type TelegramCommander = import('./telegram-commander.js').default;
import Transport from 'winston-transport';

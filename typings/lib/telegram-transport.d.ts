/**
 * @typedef {import('./telegram-cli-bot').default} TelegramCliBot
 */
export default class TelegramBotTransport extends Transport {
    /**
     * @param {TelegramCliBot} bot
     * @param {number[]} chatIds
     * @param {object} [opts={}]
     * @param {Transport.TransportStreamOptions} [opts.transportOpts]
     */
    constructor(bot: TelegramCliBot, chatIds: number[], opts?: {
        transportOpts?: Transport.TransportStreamOptions;
    });
    /** @type {TelegramCliBot} */ bot: TelegramCliBot;
    /** @type {number[]} */ chatIds: number[];
    /**
     * @param {*} info
     * @param {function} next
     */
    log(info: any, next: Function): void;
}
export type TelegramCliBot = import('./telegram-cli-bot').default;
import Transport from 'winston-transport';

/**
 * @typedef {import('../telegram-commander.js').default} TelegramCommander
 */
export default class TelegramCommanderPlugin {
    /** @type {TelegramCommander} */ bot: TelegramCommander;
    init(bot: any): void;
}
export type TelegramCommander = import('../telegram-commander.js').default;

/**
 * @typedef {import('../telegram-commander.js').default} TelegramCommander
 */
export default class TelegramCommanderPlugin {
    /** @type {TelegramCommander} */ commander: TelegramCommander;
    init(commander: any): void;
}
export type TelegramCommander = import('../telegram-commander.js').default;

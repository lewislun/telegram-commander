/**
 * @typedef {import('node-telegram-bot-api').Message} Message
 * @typedef {import('node-telegram-bot-api').SendMessageOptions} SendMessageOptions
 * @typedef {import('./context').default} Context
 *
 * @typedef TelegramCliBotOptions
 * @property {import('winston').Logger} [logger]
 * @property {boolean} [enableStartCommand=true] whether to enable /start command
 * @property {boolean} [enableCancelCommand=true] whether to enable /cancel command
 * @property {number[]} [whitelistedChatIds] Only allow commands from these chat ids. If not set, all chat ids are allowed.
 *
 * @typedef Command
 * @property {string} name
 * @property {CommandHandler} handler
 * @property {string[]} [params] Names here are for help messages only, but the number of names will be used to change against the number of args passed to the handler.
 * @property {string[]} [optionalParams] Names here are for help messages only.
 * @property {string} [description] for help message
 * @property {boolean} [enabled=true]
 * @property {boolean} [helpMsgEnabled=true] If true, the command will be included in /start message
 *
 * @typedef {(ctx: Context) => Promise<void>} CommandHandler
 */
export class ContextCancelError extends Error {
}
export type Message = import('node-telegram-bot-api').Message;
export type SendMessageOptions = import('node-telegram-bot-api').SendMessageOptions;
export type Context = import('./context').default;
export type TelegramCliBotOptions = {
    logger?: import('winston').Logger;
    /**
     * whether to enable /start command
     */
    enableStartCommand?: boolean;
    /**
     * whether to enable /cancel command
     */
    enableCancelCommand?: boolean;
    /**
     * Only allow commands from these chat ids. If not set, all chat ids are allowed.
     */
    whitelistedChatIds?: number[];
};
export type Command = {
    name: string;
    handler: CommandHandler;
    /**
     * Names here are for help messages only, but the number of names will be used to change against the number of args passed to the handler.
     */
    params?: string[];
    /**
     * Names here are for help messages only.
     */
    optionalParams?: string[];
    /**
     * for help message
     */
    description?: string;
    enabled?: boolean;
    /**
     * If true, the command will be included in /start message
     */
    helpMsgEnabled?: boolean;
};
export type CommandHandler = (ctx: Context) => Promise<void>;

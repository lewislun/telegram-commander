/**
 * @typedef {import('node-telegram-bot-api').Message} Message
 * @typedef {import('node-telegram-bot-api').ParseMode} ParseMode
 * @typedef {import('node-telegram-bot-api').SendMessageOptions} SendMessageOptions
 * @typedef {import('./context').default} Context
 *
 * @typedef TelegramCliBotOptions
 * @property {import('winston').Logger} [logger]
 * @property {boolean} [startCommandEnabled=true] whether to enable /start command
 * @property {boolean} [cancelCommandEnabled=true] whether to enable /cancel command
 * @property {number[]} [whitelistedChatIds] Only allow commands from these chat ids. If not set, all chat ids are allowed.
 * @property {ParseMode} [defaultParseMode='MarkdownV2']
 * @property {boolean} [errorReplyEnabled=true] whether to reply with error message when an error occurs
 *
 * @typedef Command
 * @property {string} name
 * @property {CommandHandler} handler
 * @property {string[]} [params] Names here are for help messages only, but the number of names will be used to change against the number of args passed to the handler.
 * @property {string[]} [optionalParams] Names here are for help messages only.
 * @property {string} [description] for help message
 * @property {boolean} [enabled=true]
 * @property {boolean} [startCommandEnabled=true] If true, the command will be included in /start message.
 * @property {boolean} [listingEnabled=true] If true, the command will be included in the command listing. (i.e. register at BotFather)
 *
 * @typedef {(ctx: Context) => Promise<void>} CommandHandler
 */
export class ContextCancelError extends Error {
}
export type Message = import('node-telegram-bot-api').Message;
export type ParseMode = import('node-telegram-bot-api').ParseMode;
export type SendMessageOptions = import('node-telegram-bot-api').SendMessageOptions;
export type Context = import('./context').default;
export type TelegramCliBotOptions = {
    logger?: import('winston').Logger;
    /**
     * whether to enable /start command
     */
    startCommandEnabled?: boolean;
    /**
     * whether to enable /cancel command
     */
    cancelCommandEnabled?: boolean;
    /**
     * Only allow commands from these chat ids. If not set, all chat ids are allowed.
     */
    whitelistedChatIds?: number[];
    defaultParseMode?: ParseMode;
    /**
     * whether to reply with error message when an error occurs
     */
    errorReplyEnabled?: boolean;
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
     * If true, the command will be included in /start message.
     */
    startCommandEnabled?: boolean;
    /**
     * If true, the command will be included in the command listing. (i.e. register at BotFather)
     */
    listingEnabled?: boolean;
};
export type CommandHandler = (ctx: Context) => Promise<void>;

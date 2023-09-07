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

// This is thrown while waiting for a message and the context is cancelled.
export class ContextCancelError extends Error {

}
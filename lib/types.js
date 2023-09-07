/**
 * @typedef {import('node-telegram-bot-api').Message} Message
 * @typedef {import('node-telegram-bot-api').SendMessageOptions} SendMessageOptions
 * @typedef {import('./context').default} Context
 * 
 * @typedef TelegramCliBotOptions
 * @property {import('winston').Logger} [logger]
 * @property {boolean} [enableStartCommand=true] whether to enable /start command
 * @property {boolean} [enableHelpCommand=true] whether to enable /help command
 * @property {boolean} [enableChatIdCommand=false] whether to enable /chatid command
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
 * @property {boolean} [helpMsgEnabled=true] If true, the command will be included in /help and /start message
 * 
 * @typedef {(ctx: Context) => Promise<void>} CommandHandler
 */

// This is thrown while waiting for a message and the context is cancelled.
export class ContextCancelError extends Error {

}
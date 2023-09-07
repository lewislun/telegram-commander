/**
 * @typedef TelegramCliBotOptions
 * @property {import('winston').Logger} [logger]
 * @property {boolean} [enableStartCommand=true] whether to enable /start command
 * @property {boolean} [enableHelpCommand=true] whether to enable /help command
 * @property {boolean} [enableChatIdCommand=true] whether to enable /chatid command
 * @property {number[]} [whitelistedChatIds] Only allow commands from these chat ids. If not set, all chat ids are allowed.
 * 
 * @typedef Command
 * @property {string} name
 * @property {CommandHandler} handler
 * @property {string[]} [args] names are for help message, but the number of names should match the number of args in handler
 * @property {string[]} [optionalArgs] optional args
 * @property {string} [description] for help message
 * 
 * @typedef {(msg: Message, session: object, ...args: string[]) => Promise<void>} CommandHandler
 */

export {}
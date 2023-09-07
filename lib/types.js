/**
 * @typedef TelegramCliBotOptions
 * @property {import('winston').Logger} [logger]
 * @property {boolean} [enableStartCommand=true] whether to enable /start command
 * @property {boolean} [enableHelpCommand=true] whether to enable /help command
 * @property {boolean} [enableChatIdCommand=true] whether to enable /chatid command
 * 
 * @typedef Command
 * @property {string} name
 * @property {CommandHandler} handler
 * @property {string[]} [argNames] names are for help message, but the number of names should match the number of args in handler
 * @property {string} [description] for help message
 * 
 * @typedef {(msg: Message, ...args: string[]) => Promise<void>} CommandHandler
 */

export {}
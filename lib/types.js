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
 * @property {string[]} [params] names are for help message, but the number of names should match the number of args in handler
 * @property {string[]} [optionalParams] optional args
 * @property {string} [description] for help message
 * @property {boolean} [sessionEnabled=false] If true, a session will be passed as the 2nd param of the handler and subsequent messages (not prefixed with /) from the same user will call the command again until session.end() is called. CAUTION: to read message from groups, talk to \@BotFather and disable privacy mode
 * 
 * @typedef Session
 * @property {string} _commandName name of the command that is being executed
 * @property {function} end end the session
 * 
 * @typedef {(msg: Message, session: Session, ...args: string[]) => Promise<void>} CommandHandler
 */

export {}
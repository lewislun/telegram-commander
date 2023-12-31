/**
 * @typedef {import('node-telegram-bot-api').Message} Message
 * @typedef {import('node-telegram-bot-api').ParseMode} ParseMode
 * @typedef {import('node-telegram-bot-api').SendMessageOptions} SendMessageOptions
 * @typedef {import('./context').default} Context
 * @typedef {import('./plugins/index').TelegramCommanderPlugin} TelegramCommanderPlugin
 * 
 * @typedef TelegramCommanderOptions
 * @property {import('winston').Logger} [logger]
 * @property {boolean} [startCommandEnabled=true] whether to enable /start command
 * @property {boolean} [cancelCommandEnabled=true] whether to enable /cancel command
 * @property {number[]} [whitelistedChatIds] Only allow commands from these chat ids. If not set, all chat ids are allowed.
 * @property {ParseMode} [defaultParseMode='MarkdownV2']
 * @property {boolean} [errorReplyEnabled=true] whether to reply with error message when an error occurs
 * @property {boolean} [unauthorizedReplyEnabled=true] whether to reply with unauthorized message when a command is called from an unauthorized chat id
 * @property {TelegramCommanderPlugin[]} [plugins]
 * 
 * @typedef Command
 * @property {string} name
 * @property {(ctx: Context) => Promise<void>} handler
 * @property {string} [category] for organizing commands in help message
 * @property {string} [description] for help message
 * @property {boolean} [groupMode=true] If true, every one in the group can reply to the conversation. Does not affect direct messages.
 * @property {ContextType} [contextType='linear']
 * @property {string[]} [params] Names here are for help messages only, but the number of names will be used to change against the number of args passed to the handler.
 * @property {string[]} [optionalParams] Names here are for help messages only.
 * @property {boolean} [enabled=true]
 * @property {boolean} [startCommandEnabled=true] If true, the command will be included in /start message.
 * @property {boolean} [listingEnabled=true] If true, the command will be included in the command listing. (i.e. register at BotFather)
 * 
 * @typedef WaitForCallbackQueryOnceOptions
 * @property {boolean} [closeKeyboardOnDone=true] If true, the keyboard will be closed after the callback query is received or the context is cancelled.
 * @property {boolean} [autoBlankAnswer=true] If true, an empty answer will be sent to the callback query automatically to prevent Telegram from showing a loading indicator.
 * 
 * @typedef CallbackQueryListener
 * @property {number} id
 * @property {string} msgIdentifier
 * @property {number} [maxCount] // if set, the listener will be removed after this many callback queries
 * @property {number} listenedCount
 * @property {number} [targetUserId] // if set, only callback queries from this user will be handled
 * @property {(query: CallbackQuery) => Promise<void>} handler
 * 
 * @typedef MessageListener
 * @property {number} id
 * @property {number} chatId
 * @property {number} [maxCount] // if set, the listener will be removed after this many callback queries
 * @property {number} listenedCount
 * @property {number} [targetUserId] // if set, only messages from this user will be handled
 * @property {(msg: Message) => Promise<void>} handler
 */

/**
 * @enum {string}
 */
export const ContextType = {
	/** @description default type. Context will be cancelled if another command is called or a new conversation is created. */
	LINEAR: 'linear',
	/** @description Context will not be cancelled if another command is called or a new conversation is created. When used incorrectly, it may cause weird UX. This type is mostly used for inline keyboards. */
	PERSISTENT: 'persistent',
}

// This is thrown while waiting for a message and the context is cancelled.
export class ContextCancelError extends Error {

}
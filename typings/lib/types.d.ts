export type ContextType = string;
export namespace ContextType {
    let LINEAR: string;
    let PERSISTENT: string;
}
export class ContextCancelError extends Error {
}
export type Message = import('node-telegram-bot-api').Message;
export type ParseMode = import('node-telegram-bot-api').ParseMode;
export type SendMessageOptions = import('node-telegram-bot-api').SendMessageOptions;
export type Context = import('./context').default;
export type TelegramCommanderPlugin = import('./plugins/index').TelegramCommanderPlugin;
export type TelegramCommanderOptions = {
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
    plugins?: TelegramCommanderPlugin[];
};
export type Command = {
    name: string;
    handler: (ctx: Context) => Promise<void>;
    /**
     * If true, every one in the group can reply to the conversation. Does not affect direct messages.
     */
    groupMode?: boolean;
    contextType?: ContextType;
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
export type WaitForCallbackQueryOnceOptions = {
    /**
     * If true, the keyboard will be closed after the callback query is received or the context is cancelled.
     */
    closeKeyboardOnDone?: boolean;
    /**
     * If true, an empty answer will be sent to the callback query automatically to prevent Telegram from showing a loading indicator.
     */
    autoBlankAnswer?: boolean;
};
export type CallbackQueryListener = {
    id: number;
    msgIdentifier: string;
    maxCount?: number;
    listenedCount: number;
    targetUserId?: number;
    handler: (query: CallbackQuery) => Promise<void>;
};
export type MessageListener = {
    id: number;
    chatId: number;
    maxCount?: number;
    listenedCount: number;
    targetUserId?: number;
    handler: (msg: Message) => Promise<void>;
};

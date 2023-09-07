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
     * whether to enable /help command
     */
    enableHelpCommand?: boolean;
    /**
     * whether to enable /chatid command
     */
    enableChatIdCommand?: boolean;
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
     * If true, the command will be included in /help and /start message
     */
    helpMsgEnabled?: boolean;
};
export type CommandHandler = (ctx: Context) => Promise<void>;

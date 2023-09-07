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
     * Only allow commands from these chat ids. If not set, all chat ids are allowed.
     */
    whitelistedChatIds?: number[];
};
export type Command = {
    name: string;
    handler: CommandHandler;
    /**
     * names are for help message, but the number of names should match the number of args in handler
     */
    args?: string[];
    /**
     * optional args
     */
    optionalArgs?: string[];
    /**
     * for help message
     */
    description?: string;
};
export type CommandHandler = (msg: Message, session: object, ...args: string[]) => Promise<void>;

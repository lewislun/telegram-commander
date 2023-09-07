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
    params?: string[];
    /**
     * optional args
     */
    optionalParams?: string[];
    /**
     * for help message
     */
    description?: string;
    /**
     * If true, a session will be passed as the 2nd param of the handler and subsequent messages (not prefixed with /) from the same user will call the command again until session.end() is called. CAUTION: to read message from groups, talk to \@BotFather and disable privacy mode
     */
    sessionEnabled?: boolean;
};
export type Session = {
    /**
     * name of the command that is being executed
     */
    _commandName: string;
    /**
     * end the session
     */
    end: Function;
};
export type CommandHandler = (msg: Message, session: Session, ...args: string[]) => Promise<void>;

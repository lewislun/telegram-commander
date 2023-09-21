import { TelegramCommander, CommandAuth } from '../index.js'

const TOKEN = process.env.TELEGRAM_BOT_TOKEN
const ROOT_CHAT_ID = Number(process.env.ROOT_CHAT_ID)
const bot = new TelegramCommander(TOKEN, {
	logger: console,
	defaultParseMode: 'MarkdownV2',
	whitelistedChatIds: [ROOT_CHAT_ID],
	plugins: [
		new CommandAuth([
			{
				permission: 'root',
				approvable: false,  // approval prompt will not be shown for unauthorized users
				commandNames: ['veryimportant'],
			},
			{
				permission: 'admin',
				commandNames: ['important'],
			},
			{
				permission: 'public',
				noAuth: true,  // no authorization required
				commandNames: ['start', 'casual1', 'casual2'],
			},
		])
	],
})

bot.addCommand({
	name: 'veryimportant',
	description: 'A very important command that requires permission to access.',
	handler: async ctx => await ctx.reply('very important secret message')
})

bot.addCommand({
	name: 'important',
	description: 'An important command that requires permission to access. Users without permission can request permission upon calling this function.',
	handler: async ctx => await ctx.reply('important secret message')
})

bot.addCommand({
	name: 'casual1',
	description: 'A casual command that does not require permission to access.',
	handler: async ctx => await ctx.reply('casual message 1')
})

bot.addCommand({
	name: 'casual2',
	description: 'A casual command that does not require permission to access.',
	handler: async ctx => await ctx.reply('casual message 2')
})

// By calling syncCommands(), commands WITHOUT mandatory params will be shown in the command list in the chat with the bot
await bot.syncCommands()
import { TelegramCliBot, escapeMarkdownV2 } from '../index.js'

const TOKEN = process.env.TELEGRAM_BOT_TOKEN
const bot = new TelegramCliBot(TOKEN)

bot.addCommand({
	name: 'beep',
	description: 'I say beep, you say boop',
	handler: async ctx => await ctx.reply('boop')
})

bot.addCommand({
	name: 'math',
	description: 'Math question',
	handler: async ctx => {
		const question = escapeMarkdownV2('What is 1 + 1?')
		await ctx.reply(question)
		const msg = await ctx.waitForMessage()
		await ctx.reply(msg.text === '2'? 'Correct' : 'Wrong')
	}
})

// By calling syncCommands(), /beep will be shown in the command list in the chat with the bot
await bot.syncCommands()
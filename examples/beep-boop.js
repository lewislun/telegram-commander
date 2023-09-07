import { TelegramCliBot } from '../index.js'

const TOKEN = process.env.TELEGRAM_BOT_TOKEN
const bot = new TelegramCliBot(TOKEN)

bot.addCommand({
	name: 'beep',
	description: 'I say beep, you say boop',
	handler: async msg => await bot.sendMessage(msg.chat.id, 'boop')
})
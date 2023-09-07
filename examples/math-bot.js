import { TelegramCliBot, escapeMarkdownV2 } from '../index.js'

/**
 * @typedef {import('node-telegram-bot-api').ReplyKeyboardMarkup} ReplyKeyboardMarkup
 */

const TOKEN = process.env.TELEGRAM_BOT_TOKEN
const bot = new TelegramCliBot(TOKEN, { logger: console })

bot.addCommand({
	name: 'beep',
	description: 'I say beep, you say boop',
	handler: async ctx => await ctx.reply('boop')  // send message to the same chat the command was sent from
})

bot.addCommand({
	name: 'math',
	description: 'Math question',
	handler: async ctx => {
		const question = escapeMarkdownV2('What is 30 + 12?')
		await ctx.reply(question)
		const msg = await ctx.waitForMessage()  // msg will be the next message sent by the same user in the same chat
		await ctx.reply(msg.text === '42'? 'Correct' : 'Wrong')
	}
})

bot.addCommand({
	name: 'math2',
	description: 'Math question with Reply Keyboard Markup',
	handler: async ctx => {
		const question = escapeMarkdownV2('What is 30 + 12?')
		await ctx.reply(question, { reply_markup: {
			one_time_keyboard: true,
			keyboard: [
				['-3.14', '4 + 3i', '42'],
				['2σ', '666', 'F = ma'],
			]
		}})
		const msg = await ctx.waitForMessage()  // button presses will be sent as text messages
		await ctx.reply(msg.text === '42'? 'Correct' : 'Wrong')
	}
})

// bot.addCommand({
// 	name: 'math3',
// 	description: 'Math question with Inline Keyboard Markup',
// 	handler: async ctx => {
// 		const question = escapeMarkdownV2('What is 30 + 12?')
// 		await ctx.reply(question, { reply_markup: {
// 			one_time_keyboard: true,
// 			inline_keyboard: [
// 				[ { text: '-3.14', callback_data: '-3.14' }, { text: '4 + 3i', callback_data: '4 + 3i' }, { text: '42', callback_data: '42' } ],
// 				[ { text: '2σ', callback_data: '2σ' }, { text: '666', callback_data: '666' }, { text: 'F = ma', callback_data: 'F = ma' } ],
// 			]
// 		}})
// 		// bot.edit
// 		// bot.on('callback_query', async query => {
// 		// 	console.log('callback_query', query)
// 		// })
// 	}
// })


// By calling syncCommands(), /beep will be shown in the command list in the chat with the bot
await bot.syncCommands()
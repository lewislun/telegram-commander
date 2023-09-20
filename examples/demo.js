import { TelegramCommander, escapeMarkdownV2, ContextType } from '../index.js'

const TOKEN = process.env.TELEGRAM_BOT_TOKEN
const bot = new TelegramCommander(TOKEN, {
	logger: console,
	defaultParseMode: 'MarkdownV2',
})

bot.addCommand({
	name: 'ping',
	description: 'Simple response',
	handler: async ctx => await ctx.reply('pong')
})

bot.addCommand({
	name: 'replykeyboard',
	description: 'Reply Keyboard Markup',
	handler: async ctx => {
		await ctx.reply(escapeMarkdownV2('Reply Keyboard pops up in the user\'s screen.'), { reply_markup: {
			one_time_keyboard: true,
			keyboard: [
				['A', 'B', 'C'],
				['D', 'E', 'F'],
			]
		}})
		await ctx.reply(escapeMarkdownV2('You can also try calling /cancel to cancel the command.'))
		const msg = await ctx.waitForMessage()
		await ctx.reply(`You pressed ${msg.text}`)
		await ctx.reply('Reply Keyboard Markup closed')
	}
})

bot.addCommand({
	name: 'inlinekeyboard',
	description: 'Inline Keyboard Markup',
	handler: async ctx => {
		const inlineKeyboardMsg = await ctx.reply('Inline Keyboard Markup shows under the message', { reply_markup: {
			inline_keyboard: [
				[
					{ text: 'A', callback_data: 'A' },
					{ text: 'B', callback_data: 'B' },
					{ text: 'C', callback_data: 'C' },
				],
				[
					{ text: 'D', callback_data: 'D' },
					{ text: 'E', callback_data: 'E' },
					{ text: 'F', callback_data: 'F' },
				],
			]
		}})
		await ctx.reply(escapeMarkdownV2('You can also try calling /cancel to cancel the command.'))
		const query = await ctx.waitForCallbackQueryOnce(inlineKeyboardMsg)
		await ctx.reply(`You pressed ${query.data}`)
		await ctx.reply('Inline Keyboard Markup closed')
	}
})

bot.addCommand({
	name: 'persistentcontext',
	description: 'Persistent Context',
	type: ContextType.PERSISTENT,  // default is ContextType.LINEAR
	handler: async ctx => {
		let loopCount = 0
		await ctx.reply(escapeMarkdownV2('Persistent Context is not cancelled when another command or /cancel is called.'))
		const keyboard = [[
			{ text: 'Continue!', callback_data: 'continue' },
			{ text: 'Leave!', callback_data: 'leave' },
		]]
		const msg = await ctx.reply(`You have pressed ${loopCount} times`, { reply_markup: { inline_keyboard: keyboard }})
		await ctx.reply('You can try calling other commands at the same time')

		while (true) {
			const query = await ctx.waitForCallbackQueryOnce(msg, { closeKeyboardOnDone: false })  // listen to button press
			await bot.editMessageText(`You have pressed ${++loopCount} times`, {
				message_id: msg.message_id,
				chat_id: msg.chat.id,
				reply_markup: { inline_keyboard: keyboard }
			})  // update the message
			if (query.data === 'leave') {
				// leave the loop when the user presses the "Leave!" button
				break
			}
		}

		await bot.editMessageReplyMarkup({}, { message_id: msg.message_id, chat_id: msg.chat.id })  // close the inline keyboard
		await ctx.reply('Persistent Context closed')
	},
})

bot.addCommand({
	name: 'params',
	description: 'Command with Params',
	params: ['param1', 'param2'],
	handler: async ctx => {
		await ctx.reply(`You have entered ${ctx.args[0]} and ${ctx.args[1]}`)
		await ctx.reply('For commands with params, they will not be shown in the command list, since clicking on the command list will instantly send the command without arguments in Telegram\\.')
		await ctx.reply(escapeMarkdownV2('Arguments with spaces are supported too, just wrap them in double quotes. (e.g. /params "Hello World" 123)'))
	},
})

bot.addCommand({
	name: 'optionalparams',
	description: 'Command with Optional Params',
	optionalParams: ['param1', 'param2'],
	handler: async ctx => {
		await ctx.reply(`You have entered ${ctx.args[0]} and ${ctx.args[1]}`)
		await ctx.reply('Note that for commands with *optional params only*, the command list will show the command with the optional params, but clicking on it will still send the command without arguments in Telegram\\.')
	},
})

bot.addCommand({
	name: 'mixedparams',
	description: 'Command with both Params and Optional Params',
	params: ['param1'],
	optionalParams: ['param2'],
	handler: async ctx => {
		await ctx.reply(`You have entered ${ctx.args[0]} and ${ctx.args[1]}`)
		await ctx.reply('Note that this command is not shown in the command list, since it has params\\.')
	},
})

bot.addCommand({
	name: 'nongroup',
	description: 'Non-Group Command',
	groupMode: false,  // group mode is enabled by default
	handler: async ctx => {
		await ctx.reply('This command only listens to reply of the command caller if it is in a group chat\\.')
		await ctx.reply(escapeMarkdownV2('Waiting for caller\'s reply... (other group member can try to reply, but it will not be processed)'))
		const msg = await ctx.waitForMessage()
		await ctx.reply(`Command Caller said ${msg.text}`)
		const inlineKeyboardMsg = await ctx.reply(escapeMarkdownV2('Waiting for button press...'), { reply_markup: { inline_keyboard: [[{ text: 'Press me!', callback_data: 'press' }]] }})
		await ctx.waitForCallbackQueryOnce(inlineKeyboardMsg)
		await ctx.reply(`Command Caller pressed the button\\!`)
	},
})


// By calling syncCommands(), commands WITHOUT mandatory params will be shown in the command list in the chat with the bot
await bot.syncCommands()
import { TelegramCliBot } from '../index.js'

const TOKEN = process.env.TELEGRAM_BOT_TOKEN
const bot = new TelegramCliBot(TOKEN)
const members = [{ name: 'John', age: 20 }]

bot.addCommand({
	name: 'register',
	description: 'Register yourself as a member',
	handler: async ctx => {
		await ctx.reply('What\'s your name?')
		const name = (await ctx.waitForMessage()).text
		await ctx.reply(`Hello, ${name}\\! How old are you\\?`)
		const age = (await ctx.waitForMessage()).text

		members.push({ name, age })
		await ctx.reply(`You are registered\\!`)
	},
})

bot.addCommand({
	name: 'members',
	description: 'List all members',
	handler: async ctx => {
		await ctx.reply([
			'List of members:',
			...members.map(member => `${member.name} \\(${member.age}\\)`),
		])
	},
})

bot.addCommand({
	name: 'age',
	description: 'Get the age of a member',
	params: ['name'],
	handler: async ctx => {
		const [ name ] = ctx.args
		const member = members.find(member => member.name === name)
		if (!member) {
			await ctx.reply(`Member ${name} not found\\.`)
			return
		}
		await ctx.reply(`${member.name} is ${member.age} years old\\.`)
	},
})

bot.addCommand({
	name: 'edit',
	description: 'Edit a member\'s age (and name)',
	params: ['name', 'age'],
	optionalParams: ['new-name'],
	handler: async ctx => {
		const [ name, age, newName ] = ctx.args
		const member = members.find(member => member.name === name)
		if (!member) {
			await ctx.reply(`Member ${name} not found\\.`)
			return
		}
		member.age = age
		if (newName) {
			member.name = newName
		}
		await ctx.reply(`Member ${name} updated\\.`)
	},
})

await bot.syncCommands()
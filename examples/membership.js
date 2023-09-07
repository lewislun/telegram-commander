import { TelegramCliBot } from '../index.js'

const TOKEN = process.env.TELEGRAM_BOT_TOKEN
const bot = new TelegramCliBot(TOKEN)
const members = [{ name: 'John', age: 20 }]

bot.addCommand({
	name: 'register',
	description: 'Register yourself as a member',
	sessionEnabled: true,
	handler: async (msg, session) => {
		switch (session.state) {
			case undefined:
				await bot.sendMessage(msg.chat.id, 'What\'s your name?')
				session.state = 'name' // session is a key-value store that persists across messages
				break
			case 'name':
				session.name = msg.text
				await bot.sendMessage(msg.chat.id, `Hello, ${session.name}\\! How old are you\\?`)
				session.state = 'age'
				break
			case 'age':
				session.age = msg.text
				members.push({ name: session.name, age: session.age })
				await bot.sendMessage(msg.chat.id, `You are registered\\!`)
				session.end() // this must be call to end the session
				break
		}
	},
})

bot.addCommand({
	name: 'members',
	description: 'List all members',
	handler: async msg => {
		await bot.sendMessage(msg.chat.id, [
			'List of members:',
			...members.map(member => `${member.name} \\(${member.age}\\)`),
		])
	},
})

bot.addCommand({
	name: 'age',
	description: 'Get the age of a member',
	params: ['name'],
	handler: async (msg, _, name) => {
		const member = members.find(member => member.name)
		if (!member) {
			await bot.sendMessage(msg.chat.id, `Member ${name} not found\\.`)
			return
		}
		await bot.sendMessage(msg.chat.id, `${member.name} is ${member.age} years old\\.`)
	},
})

bot.addCommand({
	name: 'edit',
	description: 'Edit a member\'s age (and name)',
	params: ['name', 'age'],
	optionalParams: ['new-name'],
	handler: async (msg, _, name, age, newName) => {
		const member = members.find(member => member.name)
		if (!member) {
			await bot.sendMessage(msg.chat.id, `Member ${name} not found\\.`)
			return
		}
		member.age = age
		if (newName) {
			member.name = newName
		}
		await bot.sendMessage(msg.chat.id, `Member ${name} updated\\.`)
	},
})
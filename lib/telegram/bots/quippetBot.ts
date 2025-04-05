import { saveQuote } from '@/lib/db/quippets'
import { QUOTE_COMMANDS, QUOTE_SCENES } from '@/lib/telegram/commands/quippets'
import attachUser from '@/lib/telegram/middlewares/attachUser'
import type { QuippetContext } from '@/lib/telegram/types'
import { parseQuote } from '@/lib/util/openai'
import { Markup, Scenes, session, Telegraf } from 'telegraf'
import { message } from 'telegraf/filters'

const commandGroups = [
  { name: 'Quotes', commands: QUOTE_COMMANDS },
  // { name: 'Reminders', commands: REMINDER_COMMANDS },
  // { name: 'Timezone', commands: TIMEZONE_COMMANDS },
]

const availableCommands = commandGroups.map(group => {
  return `${group.name}:\n${group.commands
    .map(({ name, description }) => `  /${name} - ${description}`)
    .join('\n')}`
})

const DEFAULT_MESSAGE = `
🤖 Beep Boop! 

I am the quippet bot!
I can help you collect neat quotes you find out in the world.

Available commands:

${availableCommands.join('\n\n')}
`

if (!process.env.QUIPPET_BOT_TOKEN) {
  throw new Error('QUIPPET_BOT_TOKEN is required')
}

const quippetBot = new Telegraf<QuippetContext>(process.env.QUIPPET_BOT_TOKEN)

const stage = new Scenes.Stage<QuippetContext>([
  ...QUOTE_SCENES,
  // ...REMINDER_SCENES,
  // ...TIMEZONE_SCENES,
])

quippetBot.use(Telegraf.log())
quippetBot.use(session())
quippetBot.use(attachUser)
quippetBot.use(stage.middleware())

const allCommands = commandGroups.flatMap(({ commands }) => commands)
for (const { name, action } of allCommands) {
  quippetBot.command(name, action)
}

// Default
quippetBot.on(message('text'), async ctx => {
  const quote = await parseQuote({ text: ctx.message.text })
  const quoteWithUser = { ...quote, userId: ctx.user.id }
  await saveQuote(quoteWithUser)
  return ctx.reply('Quote saved! 📚\n\nUse /help to see all available commands.')
})

quippetBot.command('help', async ctx => ctx.reply(DEFAULT_MESSAGE, Markup.removeKeyboard()))

export default quippetBot

import { HABIT_COMMANDS, HABIT_SCENES } from '@/lib/telegram/commands/habits'
import { REMINDER_SCENES } from '@/lib/telegram/commands/reminders'
import { TIMEZONE_SCENES } from '@/lib/telegram/commands/timezone'
import attachHabits from '@/lib/telegram/middlewares/attachHabits'
import attachUser from '@/lib/telegram/middlewares/attachUser'
import saveMessage from '@/lib/telegram/middlewares/saveMessage'
import type { HabitContext } from '@/lib/telegram/types'
import { HabitProperty } from '@/lib/util/notion/NotionHabitDatabase'
import { enterScene } from '@/lib/util/telegraf'
import { Markup, Scenes, session, Telegraf } from 'telegraf'
import { message } from 'telegraf/filters'
import { LOG_HABIT_SCENE } from '../commands/habits/logHabit'
import PostgresSessionStore from '../middlewares/session/sessionStore'

const commandGroups = [
  { name: 'Habit Commands', commands: HABIT_COMMANDS },
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

I am the habit tracking bot!
I can help you stay accountable to your habits.

${availableCommands.join('\n\n')}
`

const getDefaultMessage = async (ctx: HabitContext) => {
  if (!ctx.habitDatabase) {
    return DEFAULT_MESSAGE
  }

  const habits = await ctx.habitDatabase.getHabits()
  if (habits.length === 0) {
    return DEFAULT_MESSAGE
  }

  return DEFAULT_MESSAGE + '\n\nYour Habits:\n' + habits.map(habit => habit.name).join('\n')
}

if (!process.env.HABIT_BOT_TOKEN) throw new Error('HABIT_BOT_TOKEN is required')

const habitBot = new Telegraf<HabitContext>(process.env.HABIT_BOT_TOKEN)

const stage = new Scenes.Stage<HabitContext>([
  ...HABIT_SCENES,
  ...REMINDER_SCENES,
  ...TIMEZONE_SCENES,
])

habitBot.use(Telegraf.log())
habitBot.use(
  session({
    getSessionKey: ({ chat }) => chat?.id.toString() ?? '',
    store: new PostgresSessionStore(),
    defaultSession: ctx => ({
      recentValues: {},
    }),
  })
)
habitBot.use(attachUser)
habitBot.use(attachHabits)
habitBot.use(saveMessage)
habitBot.use(stage.middleware())

const allCommands = commandGroups.flatMap(({ commands }) => commands)
for (const { name, action } of allCommands) {
  habitBot.command(name, action)
}

const getHabitKeyboard = (habits: HabitProperty[]) => {
  return Markup.keyboard(habits.map(habit => habit.emoji)).resize()
}

// Default
habitBot.on(message('text'), async ctx => {
  if (ctx.habitDatabase) {
    const habit = await ctx.habitDatabase.getHabitByEmoji(ctx.message.text)
    if (habit) {
      ctx.session.habit = habit
      return enterScene(LOG_HABIT_SCENE)(ctx)
    }
  }

  ctx.reply(
    await getDefaultMessage(ctx),
    getHabitKeyboard((await ctx.habitDatabase?.getHabits()) ?? [])
  )
})

export default habitBot

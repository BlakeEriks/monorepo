import { HABIT_SCENES } from '@/lib/telegram/bots/habitBot/commands'
import { REMINDER_SCENES } from '@/lib/telegram/commands/reminders'
import { TIMEZONE_SCENES } from '@/lib/telegram/commands/timezone'
import attachHabits from '@/lib/telegram/middlewares/attachHabits'
import attachUser from '@/lib/telegram/middlewares/attachUser'
import saveMessage from '@/lib/telegram/middlewares/saveMessage'
import type { HabitContext } from '@/lib/telegram/types'
import { enterScene } from '@/lib/util/telegraf'
import { Scenes, session, Telegraf } from 'telegraf'
import { message } from 'telegraf/filters'
import PostgresSessionStore from '../../middlewares/session/sessionStore'
import { LOG_HABIT_SCENE } from './commands/logHabit'
import { commandGroups, getDefaultMessage } from './defaultMessage'
import { getHabitKeyboard } from './habitBot.util'

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
    defaultSession: () => ({ recentValues: {}, step: 0 }),
  })
)
habitBot.use(attachUser)
habitBot.use(attachHabits)
habitBot.use(saveMessage)
habitBot.use(stage.middleware())
habitBot.catch(async (error: any, ctx) => {
  console.error('Error in habitBot:', error)
  await ctx.reply(error.message)
})

const allCommands = commandGroups.flatMap(({ commands }) => commands)
for (const { name, action } of allCommands) habitBot.command(name, action)

// Default
habitBot.on(message('text'), async ctx => {
  /* Habit logging shortcut */
  const habit = await ctx.habitDatabase?.getHabitByName(ctx.message.text)
  if (habit) {
    ctx.session.habit = habit
    return enterScene(LOG_HABIT_SCENE)(ctx)
  }

  ctx.replyWithMarkdownV2(await getDefaultMessage(ctx), await getHabitKeyboard(ctx))
})

export default habitBot

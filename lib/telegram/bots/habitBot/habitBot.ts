import { HABIT_COMMANDS, HABIT_SCENES } from '@/lib/telegram/bots/habitBot/commands'
import { REMINDER_SCENES } from '@/lib/telegram/commands/reminders'
import { TIMEZONE_SCENES } from '@/lib/telegram/commands/timezone'
import attachHabits from '@/lib/telegram/middlewares/attachHabits'
import attachUser from '@/lib/telegram/middlewares/attachUser'
import saveMessage from '@/lib/telegram/middlewares/saveMessage'
import type { HabitContext } from '@/lib/telegram/types'
import { enterScene } from '@/lib/util/telegraf'
import { Scenes, Telegraf } from 'telegraf'
import { message } from 'telegraf/filters'
import sessionMiddleware from '../../middlewares/session'
import { LOG_HABIT_SCENE } from './commands/logHabit'
import {
  DEFAULT_MESSAGE,
  getDefaultReply,
  getHabitDetailButtons,
  getHabitKeyboard,
  getHabitKeyboardButtons,
  getTodayHabitsMarkdown,
} from './habitBot.util'

if (!process.env.HABIT_BOT_TOKEN) throw new Error('HABIT_BOT_TOKEN is required')

const habitBot = new Telegraf<HabitContext>(process.env.HABIT_BOT_TOKEN)

const stageMiddleware = new Scenes.Stage<HabitContext>([
  ...HABIT_SCENES,
  ...REMINDER_SCENES,
  ...TIMEZONE_SCENES,
]).middleware()

habitBot.use(Telegraf.log())
habitBot.use(sessionMiddleware, attachUser, attachHabits, saveMessage, stageMiddleware)
habitBot.catch(async (error: any, ctx) => {
  console.error('Error in habitBot:', error)
  await ctx.reply(error.message)
})

export const commandGroups = [{ name: 'Habit Commands', commands: HABIT_COMMANDS }]
const allCommands = commandGroups.flatMap(({ commands }) => commands)
for (const { name, action } of allCommands) habitBot.command(name, action)

// habitBot.action(/.*/, attachUser, attachHabits)
habitBot.action(/^habit_detail_(.+)$/, async ctx => {
  const habitId = ctx.match[1]
  const habits = await ctx.habitDatabase?.getHabits()
  const habit = await ctx.habitDatabase?.getHabitById(habitId)

  if (!habit) return ctx.reply('Error: Habit not found')
  if (!ctx.callbackQuery.message || !('text' in ctx.callbackQuery.message))
    return ctx.reply('Error: No message')

  return ctx.editMessageText(
    `${await getTodayHabitsMarkdown(ctx)}${habit.name}:
    Reminders: ${habit.reminders.join(', ')}`,
    {
      parse_mode: 'MarkdownV2',
      reply_markup: {
        inline_keyboard: await getHabitDetailButtons(habits),
      },
    }
  )
})

habitBot.action('go_back', async ctx => {
  const habits = await ctx.habitDatabase?.getHabits()
  if (!habits) return ctx.reply('Error: No habits')

  return ctx.editMessageText(`${await getTodayHabitsMarkdown(ctx)}`, {
    parse_mode: 'MarkdownV2',
    reply_markup: {
      inline_keyboard: await getHabitKeyboardButtons(habits),
    },
  })
})

// Default
habitBot.on(message('text'), async ctx => {
  const habit = await ctx.habitDatabase?.getHabitByName(ctx.message.text)
  if (habit) {
    ctx.session.habit = habit
    return enterScene(LOG_HABIT_SCENE)(ctx)
  }

  await ctx.replyWithMarkdownV2(DEFAULT_MESSAGE, await getHabitKeyboard(ctx))
  return getDefaultReply(ctx)
})

export default habitBot

import { HABIT_COMMANDS, HABIT_SCENES } from '@/lib/telegram/bots/habitBot/commands'
import { REMINDER_SCENES } from '@/lib/telegram/commands/reminders'
import { TIMEZONE_SCENES } from '@/lib/telegram/commands/timezone'
import attachHabits from '@/lib/telegram/middlewares/attachHabits'
import attachUser from '@/lib/telegram/middlewares/attachUser'
import saveMessage from '@/lib/telegram/middlewares/saveMessage'
import type { HabitContext } from '@/lib/telegram/types'
import { enterScene } from '@/lib/util/telegraf'
import { MiddlewareFn, NarrowedContext, Scenes, Telegraf } from 'telegraf'
import { message } from 'telegraf/filters'
import { Update } from 'telegraf/types'
import sessionMiddleware from '../../middlewares/session'
import { LOG_HABIT_SCENE } from './commands/logHabit'
import {
  DEFAULT_MESSAGE,
  getDefaultReply,
  getHabitDetailButtons,
  getHabitKeyboard,
  getHabitKeyboardButtons,
  getTimeSelectionKeyboard,
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

type ActionMiddleware = MiddlewareFn<
  NarrowedContext<HabitContext, Update.CallbackQueryUpdate> & {
    match: RegExpExecArray
  }
>

const applyHabit: ActionMiddleware = async (ctx, next) => {
  const habitId = ctx.match[1]
  if (!habitId) throw new Error('No habit ID')

  const habit = await ctx.habitDatabase?.getHabitById(habitId)
  if (!habit) throw new Error('Habit not found')

  ctx.session.habit = habit
  return next()
}

const showHabitDetail = async (ctx: HabitContext) => {
  if (!ctx.session.habit) return ctx.reply('Error: Habit not found')

  const { name, reminders, id } = ctx.session.habit

  return ctx.editMessageText(
    `${await getTodayHabitsMarkdown(ctx)}${name}: Reminders: ${reminders.join(', ')}`,
    {
      parse_mode: 'MarkdownV2',
      reply_markup: {
        inline_keyboard: await getHabitDetailButtons(id),
      },
    }
  )
}

habitBot.action(/^habit_detail_(.+)$/, applyHabit, showHabitDetail)

habitBot.action(/^habit_new_reminder_(.+)$/, applyHabit, async ctx => {
  return ctx.editMessageText('Select reminder time:', {
    reply_markup: {
      inline_keyboard: getTimeSelectionKeyboard(ctx.session.habit!.id),
    },
  })
})

// Add new action for handling time selection
habitBot.action(/^set_reminder_(.+)_(\d+)$/, applyHabit, async ctx => {
  const hour = parseInt(ctx.match[2])
  const { id } = ctx.session.habit!
  await ctx.habitDatabase?.addReminderToHabit(id, hour)

  // Update the habit in the session
  ctx.session.habit = await ctx.habitDatabase?.getHabitById(id)
  return showHabitDetail(ctx)
})

habitBot.action('go_back', async ctx => {
  return ctx.editMessageText(`${await getTodayHabitsMarkdown(ctx)}`, {
    parse_mode: 'MarkdownV2',
    reply_markup: {
      inline_keyboard: await getHabitKeyboardButtons(ctx),
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

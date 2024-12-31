import { updateUser } from '@/lib/db/user'
import { HABIT_COMMANDS, HABIT_SCENES } from '@/lib/telegram/bots/habitBot/commands'
import { REMINDER_SCENES } from '@/lib/telegram/commands/reminders'
import { TIMEZONE_SCENES } from '@/lib/telegram/commands/timezone'
import attachHabits from '@/lib/telegram/middlewares/attachHabits'
import attachUser from '@/lib/telegram/middlewares/attachUser'
import saveMessage from '@/lib/telegram/middlewares/saveMessage'
import type { HabitContext } from '@/lib/telegram/types'
import { enterScene } from '@/lib/util/telegraf'
import { find } from 'geo-tz'
import { MiddlewareFn, NarrowedContext, Scenes, Telegraf } from 'telegraf'
import { message } from 'telegraf/filters'
import { KeyboardButton, Update } from 'telegraf/types'
import sessionMiddleware from '../../middlewares/session'
import { LOG_HABIT_SCENE } from './commands/logHabit'
import { NEW_HABIT_SCENE } from './commands/newHabit'
import { REMOVE_HABIT_SCENE } from './commands/removeHabit'
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

  const { name, reminders, id, streak = 0, weeklyGoal = 7 } = ctx.session.habit as any

  // Format reminders to show in 24h format
  const reminderTimes = reminders.length
    ? reminders.map((h: number) => `${h}:00`).join(', ')
    : 'No reminders set'

  const message = [
    await getTodayHabitsMarkdown(ctx),
    '━━━━━━━━━━━━━━━━━━━━━━━━━━',
    `*${name}*\n`,
    `🎯 Goal: ${weeklyGoal} times per week`,
    `⏰ Reminders: ${reminderTimes}`,
    `🔥 Current streak: ${streak} days`,
    '━━━━━━━━━━━━━━━━━━━━━━━━━━',
    // Add more stats here as needed
  ].join('\n')

  return ctx.editMessageText(message, {
    parse_mode: 'MarkdownV2',
    reply_markup: {
      inline_keyboard: await getHabitDetailButtons(id),
    },
  })
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
habitBot.action(/^habit_set_reminder_(.+)_(\d+)$/, applyHabit, async ctx => {
  const hour = parseInt(ctx.match[2])
  const { id } = ctx.session.habit!
  await ctx.habitDatabase?.addReminderToHabit(id, hour)

  // Update the habit in the session
  ctx.session.habit = await ctx.habitDatabase?.getHabitById(id)
  return showHabitDetail(ctx)
})

habitBot.action(/^habit_clear_reminders_(.+)$/, applyHabit, async ctx => {
  const { id, reminders } = ctx.session.habit!
  if (!reminders.length) {
    return ctx.answerCbQuery('No reminders to clear')
  }

  await ctx.habitDatabase?.clearRemindersFromHabit(id)

  // Update the habit in the session
  ctx.session.habit = await ctx.habitDatabase?.getHabitById(id)
  // Notification that reminders have been cleared
  await ctx.answerCbQuery('Reminders cleared!')
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

habitBot.action('new_habit', async ctx => {
  return enterScene(NEW_HABIT_SCENE)(ctx)
})

habitBot.action(/^habit_delete_(.+)$/, applyHabit, async ctx => {
  await ctx.scene.enter(REMOVE_HABIT_SCENE)
})

const getLocationRequestKeyboard = () => ({
  reply_markup: {
    one_time_keyboard: true,
    keyboard: [
      [
        {
          text: '📍 Share Location',
          request_location: true,
        } as KeyboardButton,
      ],
    ],
    resize_keyboard: true,
  },
})

habitBot.action('set_timezone', async ctx => {
  await ctx.reply(
    'Please share your location so I can set your timezone:',
    getLocationRequestKeyboard()
  )
})

habitBot.on(message('location'), async ctx => {
  const { latitude, longitude } = ctx.message.location
  const timezone = find(latitude, longitude)[0]

  // Save timezone to user profile
  await updateUser(ctx.user.id, { timezone })

  await ctx.reply(`Great! I've set your timezone to: ${timezone}`, {
    reply_markup: { remove_keyboard: true },
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

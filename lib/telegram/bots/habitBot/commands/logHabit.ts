import { HabitProperty, NotionPropertyType } from '@/lib/util/notion/NotionHabitDatabase'
import { replyAndLeave } from '@/lib/util/telegraf'
import { Markup, Scenes } from 'telegraf'
import { message } from 'telegraf/filters'
import { type HabitContext } from '../../../types'
import { getDefaultReply, getHabitKeyboard } from '../habitBot.util'
import backCommand from './back'

export const LOG_HABIT_SCENE = 'LOG_HABIT_SCENE'
const logHabitScene = new Scenes.BaseScene<HabitContext>(LOG_HABIT_SCENE)

logHabitScene.enter(async ctx => {
  /* If we have shortcut the habit selection, we go straight to recording */
  if (ctx.session.habit) {
    if (ctx.session.habit.type === NotionPropertyType.DATE) {
      return handleRecordHabit(ctx.session.habit, new Date().toISOString(), ctx)
    }
    if (ctx.session.habit.type === NotionPropertyType.CHECKBOX) {
      return handleRecordHabit(ctx.session.habit, 'true', ctx)
    }
    return handleHabitSelection(ctx.session.habit.id, ctx)
  }

  if (!ctx.habitDatabase) {
    return replyAndLeave('Database not set. Please set your database with /set_database_id')(ctx)
  }

  const habits = await ctx.habitDatabase.getHabits()
  if (!habits.length) {
    return replyAndLeave('You have no habits to log. Create a habit first with /new_habit')(ctx)
  }

  return ctx.reply('Push the emoji of the habit you want to log:', await getHabitKeyboard(ctx))
})

logHabitScene.command('back', backCommand('Cancelled habit logging.'))

logHabitScene.on(message('text'), async ctx => {
  if (ctx.session.habit) {
    return handleRecordHabit(ctx.session.habit, ctx.message.text, ctx)
  }

  return handleHabitSelection(ctx.message.text, ctx)
})

const handleHabitSelection = async (id: string, ctx: HabitContext) => {
  const habit = await ctx.habitDatabase.getHabitById(id)
  if (!habit) return ctx.reply('Invalid habit selection. Please try again.')

  ctx.session.habit = habit

  // Return a keyboard with the recent values for that habit
  const recentValues = ctx.session.habitMeta[habit.id]?.recentValues ?? []
  const keyboard = Markup.keyboard(recentValues.map(value => value.toString()))
    .oneTime()
    .resize()

  return ctx.reply(`Please provide data for the habit: ${habit.name}\n\nOr go /back`, keyboard)
}

const handleRecordHabit = async (habit: HabitProperty, value: string, ctx: HabitContext) => {
  await ctx.habitDatabase.logHabit(habit.id, value)
  const { timezone } = ctx.user
  const { streak = 0, lastRecorded } = ctx.session.habitMeta[habit.id] ?? {}
  ctx.session.habit = undefined

  // Check if last recorded was yesterday, using user's timezone
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('en-US', {
    timeZone: timezone,
  })
  const wasYesterday =
    lastRecorded &&
    new Date(lastRecorded).toLocaleDateString('en-US', { timeZone: timezone }) === yesterday

  ctx.session.habitMeta[habit.id] = {
    recentValues: [
      value,
      ...(ctx.session.habitMeta[habit.id]?.recentValues ?? []).filter(v => v !== value),
    ].slice(0, 3),
    lastRecorded: new Date(),
    streak: wasYesterday ? streak + 1 : streak,
  }
  await ctx.reply(`${habit.name} Saved!`, await getHabitKeyboard(ctx))
  return getDefaultReply(ctx).then(() => ctx.scene.leave())
}

export default logHabitScene

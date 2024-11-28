import { HabitProperty, NotionPropertyType } from '@/lib/util/notion/NotionHabitDatabase'
import { replyAndLeave } from '@/lib/util/telegraf'
import { Markup, Scenes } from 'telegraf'
import { message } from 'telegraf/filters'
import { type HabitContext } from '../../types'

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
    return handleHabitSelection(ctx.session.habit.emoji, ctx)
  }

  if (!ctx.habitDatabase) {
    return replyAndLeave('Database not set. Please set your database with /set_database_id')(ctx)
  }

  const habits = await ctx.habitDatabase.getHabits()
  if (!habits.length) {
    return replyAndLeave('You have no habits to log. Create a habit first with /new_habit')(ctx)
  }

  return ctx.reply(
    'Push the emoji of the habit you want to log:',
    Markup.keyboard(habits.map(habit => habit.emoji))
      .oneTime()
      .resize()
  )
})

logHabitScene.command('back', replyAndLeave('Cancelled habit logging.'))

logHabitScene.on(message('text'), async ctx => {
  if (ctx.session.habit) {
    return handleRecordHabit(ctx.session.habit, ctx.message.text, ctx)
  }

  return handleHabitSelection(ctx.message.text, ctx)
})

const handleHabitSelection = async (emoji: string, ctx: HabitContext) => {
  const habits = await ctx.habitDatabase.getHabits()
  const habit = habits.find(habit => habit.emoji === emoji)

  if (!habit) {
    return ctx.reply('Invalid habit selection. Please try again.')
  }
  ctx.session.habit = habit

  return ctx.reply(`Please provide data for the habit: ${habit.name}`)
}

const handleRecordHabit = async (habit: HabitProperty, value: string, ctx: HabitContext) => {
  await ctx.habitDatabase.logHabit(habit.id, value)
  ctx.session.habit = undefined
  ctx.session.recentValues[habit.emoji] = [
    value,
    ...(ctx.session.recentValues[habit.emoji] ?? []),
  ].slice(0, 3)
  return replyAndLeave(`${habit.name} Saved!`)(ctx)
}

export default logHabitScene

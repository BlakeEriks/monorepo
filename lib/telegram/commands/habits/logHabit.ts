import { replyAndLeave } from '@/lib/util/telegraf'
import { Markup, Scenes } from 'telegraf'
import { message } from 'telegraf/filters'
import type { HabitContext } from '../../types'

export const LOG_HABIT_SCENE = 'LOG_HABIT_SCENE'
const logHabitScene = new Scenes.BaseScene<HabitContext>(LOG_HABIT_SCENE)

logHabitScene.enter(async ctx => {
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
    await ctx.habitDatabase.logHabit(ctx.session.habit.id, ctx.message.text)
    return replyAndLeave('Habit logged successfully!')(ctx)
  }

  const habits = await ctx.habitDatabase.getHabits()
  const habit = habits.find(habit => habit.emoji === ctx.message.text)

  if (!habit) {
    return ctx.reply('Invalid habit selection. Please try again.')
  }
  ctx.session.habit = habit

  return ctx.reply(`Please provide data for the habit: ${habit.name}`)
})

export default logHabitScene

import type { HabitContext } from '@/lib/telegram/types'
import { replyAndLeave } from '@/lib/util/telegraf'
import { Markup, Scenes } from 'telegraf'
import { message } from 'telegraf/filters'
import { getHabitKeyboard } from '../habitBot.util'

enum NewHabitReminderState {
  SELECT_HABIT,
  SELECT_REMINDER_TIME,
  CONFIRM,
}

interface NewHabitReminderScene extends Scenes.BaseScene<HabitContext> {
  state: {
    step: NewHabitReminderState
    selectedHabit?: { id: string; name: string }
    reminderTime?: string
  }
}

export const NEW_HABIT_REMINDER_SCENE = 'NEW_HABIT_REMINDER_SCENE'
const newHabitReminderScene = new Scenes.BaseScene<HabitContext>(
  NEW_HABIT_REMINDER_SCENE
) as NewHabitReminderScene

newHabitReminderScene.enter(async ctx => {
  const habits = await ctx.habitDatabase.getHabits()
  if (!habits.length) return replyAndLeave('You have no habits to create a reminder for.')(ctx)

  ctx.session.step = NewHabitReminderState.SELECT_HABIT
  return ctx.reply('Select a habit to remove:\n\nOr go /back', await getHabitKeyboard(ctx))
})

newHabitReminderScene.command('back', replyAndLeave('Cancelled habit removal.'))

newHabitReminderScene.on(message('text'), async ctx => {
  const habits = await ctx.habitDatabase.getHabits()

  switch (ctx.session.step) {
    case NewHabitReminderState.SELECT_HABIT: {
      const habit = await ctx.habitDatabase.getHabitByEmoji(ctx.message.text)

      if (!habit) return ctx.reply('Habit not found or already deleted.')

      ctx.session.habit = habit
      ctx.session.step = NewHabitReminderState.CONFIRM

      return ctx.reply(
        `Are you sure you want to delete '${habit.text}'?\n` +
          `Type the habit name to confirm deletion or /back to cancel.`,
        Markup.removeKeyboard()
      )
    }

    case NewHabitReminderState.CONFIRM: {
      const habit = ctx.session.habit
      if (!habit) return replyAndLeave('No habit selected.')(ctx)

      if (ctx.message.text !== habit.text) {
        return ctx.reply(
          'Names do not match. Please type the exact habit name to confirm deletion.\n' +
            `Habit name: ${habit.text}`
        )
      }

      await ctx.habitDatabase.removeHabit(habit.name)
      return replyAndLeave(`Habit '${habit.name}' has been deleted.`)(ctx)
    }

    default:
      return replyAndLeave('No habit selected.')(ctx)
  }
})

export default newHabitReminderScene

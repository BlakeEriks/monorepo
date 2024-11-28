import type { HabitContext } from '@/lib/telegram/types'
import { replyAndLeave } from '@/lib/util/telegraf'
import { Markup, Scenes } from 'telegraf'
import { message } from 'telegraf/filters'
import { getHabitKeyboard } from '../habitBot.util'

enum RemoveHabitState {
  SELECT_HABIT,
  CONFIRM_DELETION,
}

interface RemoveHabitScene extends Scenes.BaseScene<HabitContext> {
  state: {
    step: RemoveHabitState
    selectedHabit?: { id: string; name: string }
  }
}

export const REMOVE_HABIT_SCENE = 'REMOVE_HABIT_SCENE'
const removeHabitScene = new Scenes.BaseScene<HabitContext>(REMOVE_HABIT_SCENE) as RemoveHabitScene

removeHabitScene.enter(async ctx => {
  const habits = await ctx.habitDatabase.getHabits()
  if (!habits.length) return replyAndLeave('You have no habits to remove.')(ctx)

  ctx.session.step = RemoveHabitState.SELECT_HABIT
  return ctx.reply('Select a habit to remove:\n\nOr go /back', await getHabitKeyboard(ctx))
})

removeHabitScene.command('back', replyAndLeave('Cancelled habit removal.'))

removeHabitScene.on(message('text'), async ctx => {
  const habits = await ctx.habitDatabase.getHabits()

  switch (ctx.session.step) {
    case RemoveHabitState.SELECT_HABIT: {
      const habit = await ctx.habitDatabase.getHabitByEmoji(ctx.message.text)

      if (!habit) return ctx.reply('Habit not found or already deleted.')

      ctx.session.habit = habit
      ctx.session.step = RemoveHabitState.CONFIRM_DELETION

      return ctx.reply(
        `Are you sure you want to delete '${habit.text}'?\n` +
          `Type the habit name to confirm deletion or /back to cancel.`,
        Markup.removeKeyboard()
      )
    }

    case RemoveHabitState.CONFIRM_DELETION: {
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

export default removeHabitScene

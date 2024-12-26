import type { HabitContext } from '@/lib/telegram/types'
import { replyAndLeave } from '@/lib/util/telegraf'
import { Scenes } from 'telegraf'
import { message } from 'telegraf/filters'
import { BooleanOption, getBooleanKeyboard } from '../habitBot.util'
import backCommand from './back'

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

removeHabitScene.enter(async ctx =>
  ctx.reply('Are you sure you want to delete this habit?', await getBooleanKeyboard())
)

removeHabitScene.command('back', backCommand('Cancelled habit removal.'))

removeHabitScene.on(message('text'), async ctx => {
  if (!ctx.session.habit) return replyAndLeave('No habit selected.')(ctx)
  const { id, name } = ctx.session.habit

  if (ctx.message.text === BooleanOption.YES) {
    await ctx.habitDatabase.removeHabit(id)
    return replyAndLeave(`Habit '${name}' has been deleted.`)(ctx)
  }
  if (ctx.message.text === BooleanOption.NO) {
    return replyAndLeave('Cancelled habit removal.')(ctx)
  }

  return ctx.reply('Please select a valid option.')
})

export default removeHabitScene

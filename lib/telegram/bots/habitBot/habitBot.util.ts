import { Markup } from 'telegraf'
import { HabitContext } from '../../types'

export const getHabitKeyboard = async (ctx: HabitContext) => {
  const habits = await ctx.habitDatabase?.getHabits()
  if (!habits) return undefined
  return Markup.keyboard(habits.map(habit => habit.emoji)).resize()
}

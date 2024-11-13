import type { HabitContext } from '../../types'

const listHabits = async (ctx: HabitContext) => {
  if (!ctx.habitDatabase) {
    return ctx.reply(
      "Unable to find habit database. Try /setDatabaseId to set it, and make sure you've granted access to the extension"
    )
  }

  const habitStr = await ctx.habitDatabase.prettyPrintHabits()
  return ctx.reply(`Here's a list of the habits you are tracking:\n\n${habitStr}`)
}

export default listHabits

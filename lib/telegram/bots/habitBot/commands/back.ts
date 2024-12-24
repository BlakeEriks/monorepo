import { HabitContext } from '@/lib/telegram/types'
import { getDefaultReply, getHabitKeyboard } from '../habitBot.util'

const backCommand = (exitMessage: string) => async (ctx: HabitContext) => {
  await ctx.reply(exitMessage, await getHabitKeyboard(ctx))
  await getDefaultReply(ctx)
  return ctx.scene.leave()
}

export default backCommand

import type { Context } from 'telegraf'
import { Markup } from 'telegraf'
import { getDefaultReply, getHabitKeyboard } from '../telegram/bots/habitBot/habitBot.util'

interface ContextWithScene extends Context {
  scene: any
}

export const enterScene = (sceneName: string) => (ctx: ContextWithScene) =>
  ctx.scene.enter(sceneName)

export const replyAndLeave =
  (message: string, keyboard?: Markup.Markup<any>) => async (ctx: any) => {
    await ctx.replyWithHTML(message, keyboard ?? (await getHabitKeyboard(ctx)))
    await getDefaultReply(ctx)
    await ctx.scene.leave()
  }

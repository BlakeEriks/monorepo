import type { Context } from 'telegraf'
import { Markup } from 'telegraf'

interface ContextWithScene extends Context {
  scene: any
}

export const enterScene = (sceneName: string) => (ctx: ContextWithScene) =>
  ctx.scene.enter(sceneName)

export const replyAndLeave =
  (message: string, removeKeyboard = false) =>
  async (ctx: any) => {
    await ctx.replyWithHTML(message, removeKeyboard ? Markup.removeKeyboard() : undefined)
    return ctx.scene.leave()
  }

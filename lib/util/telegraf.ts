import type { Context } from 'telegraf'
import { Markup } from 'telegraf'

interface ContextWithScene extends Context {
  scene: any
}

export const enterScene = (sceneName: string) => (ctx: ContextWithScene) =>
  ctx.scene.enter(sceneName)

export const replyAndLeave = (message: string, keyboard?: Markup.Markup<any>) => (ctx: any) =>
  ctx.replyWithHTML(message, keyboard).then(() => ctx.scene.leave())

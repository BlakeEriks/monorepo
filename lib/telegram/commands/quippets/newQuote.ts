import { saveQuote } from '@/lib/db/quippets'
import { parseQuote } from '@/lib/util/openai'
import { replyAndLeave } from '@/lib/util/telegraf'
import { Scenes } from 'telegraf'
import { message } from 'telegraf/filters'
import type { QuippetContext } from '../../types'
export const NEW_QUOTE_SCENE = 'NEW_QUOTE_SCENE'

export const newQuoteScene = new Scenes.BaseScene<QuippetContext>(NEW_QUOTE_SCENE)
newQuoteScene.enter(ctx => {
  return ctx.reply(
    `What is the quote?\n Please provide textual or image representation, and I will parse it for you 😀\n\nOr go /back`
  )
})

newQuoteScene.command('back', replyAndLeave('Cancelled quote creation.'))

newQuoteScene.on(message('text'), async ctx => {
  const quote = await parseQuote({ text: ctx.message.text })
  const quoteWithUser = { ...quote, userId: ctx.user.id }
  await saveQuote(quoteWithUser)
  return replyAndLeave(`Quote saved!`)(ctx)
})

newQuoteScene.on(message('photo'), async ctx => {
  const photo = ctx.message.photo[ctx.message.photo.length - 1]
  if (!photo) {
    return replyAndLeave('ERROR - Photo is missing')(ctx)
  }

  const fileUrl = await ctx.telegram.getFileLink(photo.file_id)
  const quote = await parseQuote({ imageURL: fileUrl.href })
  const quoteWithUser = { ...quote, userId: ctx.user.id }
  await saveQuote(quoteWithUser)
  return replyAndLeave(`Quote saved!`)(ctx)
})

// newQuoteScene.on(message(''))

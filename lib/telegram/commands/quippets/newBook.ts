import { addBookToReadingList } from '@/lib/util/notion'
import { getBookInfo } from '@/lib/util/openai'
import { replyAndLeave } from '@/lib/util/telegraf'
import { Scenes } from 'telegraf'
import { message } from 'telegraf/filters'
import type { QuippetContext } from '../../types'

export const NEW_BOOK_SCENE = 'NEW_BOOK_SCENE'

export const newBookScene = new Scenes.BaseScene<QuippetContext>(NEW_BOOK_SCENE)
newBookScene.enter(ctx => {
  return ctx.reply('What is the book?')
})

newBookScene.command('back', replyAndLeave('Cancelled book creation.'))

newBookScene.on(message('text'), async ctx => {
  const book = await getBookInfo(ctx.message.text)
  console.log('Book:', book)
  await addBookToReadingList(book)
  return replyAndLeave(`Book saved!`)(ctx)
})

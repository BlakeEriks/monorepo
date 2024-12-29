import { sampleQuotesByUser } from '@/lib/db/quippets'
import { getAllUsers } from '@/lib/db/user'
import quippetBot from '@/lib/telegram/bots/quippetBot'
import { escapeMarkdown } from '@/lib/util/markdown'

import { NextApiRequest, NextApiResponse } from 'next'

const QUOTE_SAMPLE_SIZE = 3
type Quote = Awaited<ReturnType<typeof sampleQuotesByUser>>[number]

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('Received event')
    const allUsers = await getAllUsers()
    for (const { id, telegramId } of allUsers) {
      if (!telegramId) continue

      const quotes = await sampleQuotesByUser(id, QUOTE_SAMPLE_SIZE)
      const quotesMessage = quotes.map(formatQuote).join('\n\n\n')
      await quippetBot.telegram.sendMessage(telegramId, quotesMessage, {
        parse_mode: 'MarkdownV2',
      })
    }
    return res.json('Success')
  } catch (e) {
    console.error('Error processing update:', e)
    return res.status(500).json('Error processing update: ' + e)
  }
}

const formatQuote = (quote: Quote) => {
  let quoteContent = `> _"${escapeMarkdown(quote.content)}"_`
  if (quote.quotee) quoteContent += `\n>\n> \\- ${escapeMarkdown(quote.quotee)}`
  if (quote.book) quoteContent += `\n>\n>${escapeMarkdown(quote.book.title)}`
  return quoteContent
}

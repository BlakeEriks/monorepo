import { sampleQuotesByUser } from '@/lib/db/quippets'
import { getAllUsers } from '@/lib/db/user'
import quippetBot from '@/lib/telegram/bots/quippetBot'
import { NextApiRequest, NextApiResponse } from 'next'

const QUOTE_SAMPLE_SIZE = 3
type Quote = Awaited<ReturnType<typeof sampleQuotesByUser>>[number]

const formatQuote = (quote: Quote) => {
  return `"${quote.content}"\n\n- ${quote.quotee}`
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('Received event')
    const allUsers = await getAllUsers()
    for (const user of allUsers) {
      if (!user.telegramId) {
        console.log('Skipping user without telegramId:', user)
        continue
      }

      console.log('Sending message to user:', user)
      const quotes = await sampleQuotesByUser(user.id, QUOTE_SAMPLE_SIZE)
      const quotesMessage = quotes.map(formatQuote).join('\n\n---\n\n')
      await quippetBot.telegram.sendMessage(user.telegramId, quotesMessage)
    }
    return res.json('Success')
  } catch (e) {
    console.error('Error processing update:', e)
    return res.status(500).json('Error processing update: ' + e)
  }
}

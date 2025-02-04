import proteinBot from '@/lib/telegram/bots/proteinBot/proteinBot'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(200).json({ message: 'Protein Bot Webhook is ready!' })
    }
    await proteinBot.handleUpdate(req.body)
    return res.status(200).json({ message: 'Success' })
  } catch (e) {
    console.error('Error processing update:', e)
    return new Response('Error processing update', { status: 500 })
  }
}

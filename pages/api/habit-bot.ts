import habitBot from '@/lib/telegram/bots/habitBot'
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(200).json({ message: 'Habit Bot Webhook is ready!' })
    }
    await habitBot.handleUpdate(req.body)
    return res.status(200).json({ message: 'Success' })
  } catch (e) {
    console.error('Error processing update:', e)
    return new Response('Error processing update', { status: 500 })
  }
}

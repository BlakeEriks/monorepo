import quippetBot from '@/lib/telegram/bots/quippetBot'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'This endpoint only accepts POST requests' })
    }
    await quippetBot.handleUpdate(req.body)
    return res.status(200).json({ message: 'Success' })
  } catch (e) {
    console.error('Error processing update:', e)
    return new Response('Error processing update', { status: 500 })
  }
}

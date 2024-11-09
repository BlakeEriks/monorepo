import type { VercelRequest, VercelResponse } from '@vercel/node'
import quippetBot from '../../../lib/telegram/quippetBot'

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

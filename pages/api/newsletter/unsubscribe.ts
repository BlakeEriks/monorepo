import { PrismaClient } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  const { email } = req.body

  if (!email || !email.includes('@')) {
    return res.status(400).json({ success: false, message: 'Valid email is required' })
  }

  try {
    // Check if subscriber exists
    const subscriber = await prisma.subscriber.findUnique({
      where: { email },
    })

    // If subscriber doesn't exist, return error
    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: 'This email is not subscribed to our newsletter',
      })
    }

    // If subscriber exists but is already inactive
    if (subscriber.active === false) {
      return res.status(200).json({
        success: true,
        message: 'This email was already unsubscribed from our newsletter',
        alreadyUnsubscribed: true,
      })
    }

    // Update subscriber to inactive
    await prisma.subscriber.update({
      where: { id: subscriber.id },
      data: { active: false },
    })

    return res.status(200).json({
      success: true,
      message: 'Successfully unsubscribed from our newsletter',
    })
  } catch (error) {
    console.error('Error unsubscribing from newsletter:', error)
    return res
      .status(500)
      .json({ success: false, message: 'Failed to unsubscribe from newsletter' })
  }
}

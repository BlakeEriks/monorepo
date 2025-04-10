import { PrismaClient } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  const { email, name } = req.body

  if (!email || !email.includes('@')) {
    return res.status(400).json({ success: false, message: 'Valid email is required' })
  }

  try {
    // Check if subscriber already exists
    const existingSubscriber = await prisma.subscriber.findUnique({
      where: { email },
    })

    // If subscriber exists and is active, return success
    if (existingSubscriber) {
      if (existingSubscriber.active) {
        return res.status(200).json({
          success: true,
          message: 'You are already subscribed to the newsletter',
          isExisting: true,
        })
      } else {
        // If subscriber exists but is inactive, reactivate them
        await prisma.subscriber.update({
          where: { id: existingSubscriber.id },
          data: { active: true },
        })

        return res.status(200).json({
          success: true,
          message: 'Your subscription has been reactivated',
          isExisting: true,
          isReactivated: true,
        })
      }
    }

    // Create new subscriber
    await prisma.subscriber.create({
      data: {
        email,
        name: name || null,
        active: true,
      },
    })

    return res.status(201).json({
      success: true,
      message: 'You have been subscribed to the newsletter',
    })
  } catch (error) {
    console.error('Error subscribing to newsletter:', error)
    return res.status(500).json({ success: false, message: 'Failed to subscribe to newsletter' })
  }
}

import { PrismaClient } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  const { topicId, email, emailHash } = req.body

  if (!topicId) {
    return res.status(400).json({ success: false, message: 'Topic ID is required' })
  }

  try {
    // Check if the topic exists and is in VOTING status
    const topic = await prisma.newsletterTopic.findUnique({
      where: { id: Number(topicId) },
    })

    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found' })
    }

    if (topic.status !== 'VOTING') {
      return res
        .status(400)
        .json({ success: false, message: 'This topic is not currently accepting votes' })
    }

    let subscriberId: number | null = null

    // If email is provided, look up or create subscriber
    if (email && email.includes('@')) {
      // Check if subscriber exists
      const subscriber = await prisma.subscriber.findUnique({
        where: { email },
      })

      if (subscriber) {
        subscriberId = subscriber.id

        // Check if this subscriber has already voted
        const existingVote = await prisma.newsletterVote.findFirst({
          where: {
            subscriberId: subscriberId,
            topicId: Number(topicId),
          },
        })

        if (existingVote) {
          return res
            .status(400)
            .json({ success: false, message: 'You have already voted for this topic' })
        }
      } else {
        // Create a new subscriber
        const newSubscriber = await prisma.subscriber.create({
          data: {
            email,
            active: true,
          },
        })

        subscriberId = newSubscriber.id
      }
    }
    // If emailHash is provided (anonymous vote), check if it has voted before
    else if (emailHash) {
      const existingVote = await prisma.newsletterVote.findFirst({
        where: {
          emailHash,
          topicId: Number(topicId),
        },
      })

      if (existingVote) {
        return res
          .status(400)
          .json({ success: false, message: 'You have already voted for this topic' })
      }
    }

    // Use transaction to create vote and update topic vote count
    const [vote, updatedTopic] = await prisma.$transaction([
      // Create the vote
      prisma.newsletterVote.create({
        data: {
          subscriberId,
          topicId: Number(topicId),
          emailHash,
        },
      }),

      // Increment the topic's vote count
      prisma.newsletterTopic.update({
        where: { id: Number(topicId) },
        data: {
          votes: { increment: 1 },
        },
      }),
    ])

    return res.status(200).json({
      success: true,
      message: 'Vote recorded successfully',
      data: { topic: updatedTopic },
    })
  } catch (error) {
    console.error('Error recording vote:', error)
    return res.status(500).json({ success: false, message: 'Failed to record vote' })
  }
}

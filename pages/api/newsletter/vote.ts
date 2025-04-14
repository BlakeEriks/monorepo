import { PrismaClient } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  const { topicId, subscriberId, token } = req.body

  if (!topicId) {
    return res.status(400).json({ success: false, message: 'Topic ID is required' })
  }

  // Now require subscriber information
  if (!subscriberId || !token) {
    return res.status(400).json({
      success: false,
      message: 'Subscriber ID and token are required for voting',
    })
  }

  try {
    const election = await prisma.election.findFirst({
      where: { endedAt: null },
      include: {
        topics: true,
      },
    })

    if (!election)
      return res.status(400).json({ success: false, message: 'No active election found' })

    // Check if the topic exists and is in the current election
    const topic = await prisma.newsletterTopic.findUnique({
      where: { id: Number(topicId) },
    })

    if (!topic || !election.topics.some((t) => t.topicId === Number(topicId))) {
      return res.status(404).json({ success: false, message: 'Topic not found' })
    }

    // Verify the subscriber with their UUID token
    const subscriber = await prisma.subscriber.findUnique({
      where: { id: Number(subscriberId) },
    })

    if (!subscriber) {
      return res.status(404).json({ success: false, message: 'Subscriber not found' })
    }

    // Verify the provided token matches the subscriber's UUID
    if (subscriber.uuid !== token) {
      return res.status(403).json({ success: false, message: 'Invalid token for this subscriber' })
    }

    // Check if subscriber is active
    if (!subscriber.active) {
      return res.status(400).json({ success: false, message: 'This subscriber is not active' })
    }

    // Check if this subscriber has already voted for this topic
    const existingVote = await prisma.newsletterVote.findFirst({
      where: {
        subscriberId: Number(subscriberId),
        topicId: Number(topicId),
        electionId: Number(election.id),
      },
    })

    if (existingVote) {
      return res.status(400).json({
        success: false,
        message: 'You have already voted for this topic',
        alreadyVoted: true,
      })
    }

    // Create vote
    await prisma.newsletterVote.create({
      data: {
        subscriberId: Number(subscriberId),
        topicId: Number(topicId),
        electionId: Number(election.id),
      },
    })

    return res.status(200).json({
      success: true,
      message: 'Vote recorded successfully',
      data: {
        topic: topic,
        subscriberEmail: subscriber.email,
      },
    })
  } catch (error) {
    console.error('Error recording vote:', error)
    return res.status(500).json({ success: false, message: 'Failed to record vote' })
  }
}

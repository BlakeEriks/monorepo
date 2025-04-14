import { PrismaClient } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'

const prisma = new PrismaClient()

// Define interface for topic with vote count
interface TopicWithVotes {
  id: number
  title: string
  description: string | null
  status: string
  electionsParticipated: number
  createdAt: Date
  voteCount: number
}

/**
 * API endpoint to get the current active election with topics and vote counts
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  try {
    // Get the current active election
    const activeElection = await prisma.election.findFirst({
      where: {
        endedAt: null,
      },
      orderBy: {
        startedAt: 'desc',
      },
      include: {
        topics: {
          include: {
            topic: true,
          },
        },
      },
    })

    if (!activeElection) {
      return res.status(404).json({
        success: false,
        message: 'No active election found',
      })
    }

    // Get all topics in the current election
    const electionTopics = activeElection.topics.map((et) => ({
      ...et.topic,
      electionId: activeElection.id,
    }))

    // Get vote counts for each topic in this election
    const topicsWithVotes = await Promise.all(
      electionTopics.map(async (topic) => {
        const voteCount = await prisma.newsletterVote.count({
          where: {
            topicId: topic.id,
            electionId: activeElection.id,
          },
        })
        return {
          ...topic,
          voteCount,
        } as TopicWithVotes
      })
    )

    // Sort by vote count (highest first)
    const sortedTopics = topicsWithVotes.sort((a, b) => b.voteCount - a.voteCount)

    return res.status(200).json({
      success: true,
      election: {
        id: activeElection.id,
        startedAt: activeElection.startedAt,
        topics: sortedTopics,
      },
    })
  } catch (error: unknown) {
    console.error('Error fetching current election:', error)
    return res.status(500).json({
      success: false,
      message: 'Error fetching current election',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

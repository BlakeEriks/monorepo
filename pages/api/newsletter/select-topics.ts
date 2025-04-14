import { ElectionTopic, NewsletterTopic, PrismaClient, TopicStatus } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Selects 3 random topics for the next election based on the following rules:
 * 1. Topics that have already won (PUBLISHED) are excluded
 * 2. Topics that have participated in 3 elections are excluded
 * 3. If there are fewer than 3 eligible topics, it returns all eligible topics
 *
 * @returns Object with election ID and selected topic IDs
 */
export async function selectTopicsForElection() {
  try {
    // Find eligible topics (not published, less than 3 elections)
    const eligibleTopics = await prisma.newsletterTopic.findMany({
      where: {
        status: {
          not: TopicStatus.PUBLISHED,
        },
        electionsParticipated: {
          lt: 3,
        },
      },
    })

    if (eligibleTopics.length === 0) {
      console.log('No eligible topics found for election')
      return { electionId: null, selectedTopicIds: [] }
    }

    // Randomly select 3 topics (or fewer if less than 3 are available)
    const numToSelect = Math.min(3, eligibleTopics.length)
    const selectedTopics: NewsletterTopic[] = []
    const usedIndices = new Set()

    while (selectedTopics.length < numToSelect) {
      const randomIndex = Math.floor(Math.random() * eligibleTopics.length)

      if (!usedIndices.has(randomIndex)) {
        usedIndices.add(randomIndex)
        selectedTopics.push(eligibleTopics[randomIndex])
      }
    }

    // Create a new election record
    const newElection = await prisma.$transaction(async tx => {
      // First create the election
      const election = await tx.election.create({
        data: {
          startedAt: new Date(),
        },
      })

      // Then create the election-topic associations
      for (const topic of selectedTopics) {
        await tx.electionTopic.create({
          data: {
            electionId: election.id,
            topicId: topic.id,
          },
        })
      }

      return election
    })

    // Update selected topics to set status to VOTING and increment electionsParticipated
    const topicUpdatePromises = selectedTopics.map(topic =>
      prisma.newsletterTopic.update({
        where: { id: topic.id },
        data: {
          status: TopicStatus.VOTING,
          electionsParticipated: {
            increment: 1,
          },
        },
      })
    )

    await Promise.all(topicUpdatePromises)

    // Reset status for any previously voting topics not selected for this election
    await prisma.newsletterTopic.updateMany({
      where: {
        status: TopicStatus.VOTING,
        id: {
          notIn: selectedTopics.map(t => t.id),
        },
      },
      data: {
        status: TopicStatus.SUGGESTED,
      },
    })

    return {
      electionId: newElection.id,
      selectedTopicIds: selectedTopics.map(topic => topic.id),
    }
  } catch (error) {
    console.error('Error selecting topics for election:', error)
    throw error
  }
}

export async function handleNewElectionCycle() {
  try {
    // 1. Find the most recent active election
    const activeElection = await prisma.$transaction(async tx => {
      const election = await tx.election.findFirst({
        where: {
          endedAt: null,
        },
        include: {
          topics: {
            include: {
              topic: true,
            },
          },
        },
        orderBy: {
          startedAt: 'desc',
        },
      })

      if (!election) return null

      // Get all topics in the election with their votes
      const electionTopicIds = election.topics.map(
        (et: ElectionTopic & { topic: any }) => et.topic.id
      )

      // Count votes for each topic in this election
      const topicVotes = await Promise.all(
        electionTopicIds.map(async topicId => {
          const voteCount = await tx.newsletterVote.count({
            where: {
              topicId,
              electionId: election.id,
            },
          })
          return { topicId, voteCount }
        })
      )

      // Find the winner (topic with most votes)
      const sortedTopicVotes = topicVotes.sort((a, b) => b.voteCount - a.voteCount)
      const winner =
        sortedTopicVotes.length > 0 && sortedTopicVotes[0].voteCount > 0
          ? sortedTopicVotes[0]
          : null

      // If we found a winner, update the election and the winning topic's status
      if (winner) {
        await tx.election.update({
          where: { id: election.id },
          data: {
            endedAt: new Date(),
            winningTopicId: winner.topicId,
          },
        })
        await tx.newsletterTopic.update({
          where: { id: winner.topicId },
          data: {
            status: TopicStatus.PUBLISHED,
          },
        })
      } else {
        // Just close the election without a winner
        await tx.election.update({
          where: { id: election.id },
          data: {
            endedAt: new Date(),
          },
        })
      }

      return election
    })

    // 2. Select new topics for the next election
    const { electionId, selectedTopicIds } = await selectTopicsForElection()

    return {
      success: true,
      electionId,
      selectedTopicIds,
    }
  } catch (error: unknown) {
    console.error('Error handling new election cycle:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

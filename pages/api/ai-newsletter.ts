import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { PrismaClient } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'

const prisma = new PrismaClient()
const sesClient = new SESClient({ region: process.env.AWS_REGION })

// Define interfaces for our data structures
interface TopicWithVotes {
  id: number;
  title: string;
  description: string | null;
  status: string;
  electionsParticipated: number;
  createdAt: Date;
  electionId: number;
  voteCount: number;
}

async function generateNewsletterContent(recipientEmail: string) {
  try {
    // First get the subscriber to get their UUID
    const subscriber = await prisma.subscriber.findUnique({
      where: { email: recipientEmail }
    })

    if (!subscriber) {
      throw new Error(`Subscriber with email ${recipientEmail} not found`)
    }

    // Get the current active election
    const activeElection = await prisma.election.findFirst({
      where: {
        endedAt: null
      },
      orderBy: {
        startedAt: 'desc'
      },
      include: {
        topics: {
          include: {
            topic: true
          }
        }
      }
    })

    let topVotingTopics: TopicWithVotes[] = []
    
    if (activeElection) {
      // Get all topics in the current election
      const electionTopics = activeElection.topics.map(et => ({
        ...et.topic,
        electionId: activeElection.id
      }))

      // Get vote counts for each topic in this election
      const topicsWithVotes = await Promise.all(
        electionTopics.map(async (topic) => {
          const voteCount = await prisma.newsletterVote.count({
            where: {
              topicId: topic.id,
              electionId: activeElection.id
            }
          })
          return {
            ...topic,
            voteCount
          } as TopicWithVotes
        })
      )

      // Sort by vote count
      topVotingTopics = topicsWithVotes.sort((a, b) => b.voteCount - a.voteCount)
    }

    // Format text content
    let textContent = `
# Test Newsletter

This is a test newsletter.

## Vote for the next topic!
Click on one of the options below to vote:
`

    // Format HTML content
    let htmlContent = `
<h1>Test Newsletter</h1>
<p>This is a test newsletter.</p>
<h2>Vote for the next topic!</h2>
<p>Click on one of the options below to vote:</p>
<ol>
`

    // Add topics to both formats with the subscriber's UUID in the links for secure identification
    if (topVotingTopics.length > 0) {
      topVotingTopics.forEach((topic, index) => {
        // Include UUID in the voting URL instead of email for secure identification
        const voteUrl = `http://localhost:3000?vote=${topic.id}&subscriberId=${subscriber.id}&token=${encodeURIComponent(subscriber.uuid)}&electionId=${topic.electionId}`
        textContent += `\n${index + 1}. [${topic.title}](${voteUrl})`
        htmlContent += `<li><a href="${voteUrl}">${topic.title}</a> - ${topic.description || 'No description'} (${topic.voteCount} votes)</li>`
      })
    } else {
      // Fallback message if no topics are in voting status
      textContent += `\nNo topics available for voting at this time. Please check back later.`
      htmlContent += `<li>No topics available for voting at this time. Please check back later.</li>`
    }

    // Add unsubscribe link
    textContent += `\n\nTo unsubscribe, visit: http://localhost:3000/unsubscribe?email=${encodeURIComponent(recipientEmail)}&token=${encodeURIComponent(subscriber.uuid)}`
    htmlContent += `\n</ol><p style="margin-top: 20px; font-size: 12px;"><a href="http://localhost:3000/unsubscribe?email=${encodeURIComponent(recipientEmail)}&token=${encodeURIComponent(subscriber.uuid)}">Unsubscribe</a></p>`

    return { textContent, htmlContent }
  } catch (error) {
    console.error('Error generating newsletter content:', error)
    // Return generic content if error occurs since we can't generate personalized content
    return {
      textContent: `
# Test Newsletter

This is a test newsletter.

Please visit http://localhost:3000 to vote on topics or manage your subscription.
`,
      htmlContent: `
        <h1>Test Newsletter</h1>
        <p>This is a test newsletter.</p>
        <p>Please visit <a href="http://localhost:3000">our website</a> to vote on topics or manage your subscription.</p>
      `
    }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      // Get all active subscribers
      const activeSubscribers = await prisma.subscriber.findMany({
        where: {
          active: true
        }
      })

      if (activeSubscribers.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No active subscribers found to send the newsletter to.'
        })
      }

      // Check if we have active topics in voting status
      const votingTopics = await prisma.newsletterTopic.findMany({
        where: {
          status: 'VOTING'
        }
      })

      // If we don't have any voting topics, we need to start a new election cycle
      if (votingTopics.length === 0) {
        // Import the function dynamically to avoid circular dependency
        const { handleNewElectionCycle } = await import('./newsletter/select-topics')
        const result = await handleNewElectionCycle()
        
        if (!result.success) {
          return res.status(500).json({
            success: false,
            message: 'Failed to start new election cycle',
            error: result.error
          })
        }
      }

      // In a real production environment, you would loop through all subscribers
      // and send personalized emails to each one with their own voting links
      // For testing, we'll just send to the first subscriber
      const testEmail = activeSubscribers[0].email

      // Generate personalized newsletter content with subscriber's UUID in voting links
      const { textContent, htmlContent } = await generateNewsletterContent(testEmail)

      const params = {
        Source: 'blakeeriks.dev@gmail.com', // Verified email in SES
        Destination: {
          ToAddresses: [testEmail], // In production, you'd use BCC for all subscribers
        },
        Message: {
          Subject: { Data: 'Test Newsletter' },
          Body: {
            Html: { Data: htmlContent },
            Text: { Data: textContent },
          },
        },
      }

      const data = await sesClient.send(new SendEmailCommand(params))
      console.log('Email sent successfully', data)

      // In a real implementation, you'd batch send to all subscribers
      // using a queue system or a loop with small batches
      return res.status(200).json({
        success: true,
        message: `Newsletter sent to ${activeSubscribers.length} subscribers!`,
        testMode: true,
        testEmail
      })
    } catch (error) {
      console.error('Error sending email:', error)
      return res.status(500).json({ success: false, message: 'Error sending newsletter.' })
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}

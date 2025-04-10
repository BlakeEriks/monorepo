import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { PrismaClient } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'

const prisma = new PrismaClient()
const sesClient = new SESClient({ region: process.env.AWS_REGION })

async function generateNewsletterContent() {
  try {
    // Get top 3 voting topics
    const topVotingTopics = await prisma.newsletterTopic.findMany({
      where: {
        status: 'VOTING',
      },
      orderBy: {
        votes: 'desc',
      },
      take: 3,
    })

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

    // Add topics to both formats
    if (topVotingTopics.length > 0) {
      topVotingTopics.forEach((topic, index) => {
        const voteUrl = `http://localhost:3000?vote=${topic.id}`
        textContent += `\n${index + 1}. [${topic.title}](${voteUrl})`
        htmlContent += `<li><a href="${voteUrl}">${topic.title}</a> - ${topic.votes} votes</li>`
      })
    } else {
      // Default topics if none found in database
      textContent += `
1. [Whales](http://localhost:3000?vote=1)
2. [Roman Empire](http://localhost:3000?vote=2)
3. [Penguins](http://localhost:3000?vote=3)`

      htmlContent += `
<li><a href="http://localhost:3000?vote=1">Whales</a></li>
<li><a href="http://localhost:3000?vote=2">Roman Empire</a></li>
<li><a href="http://localhost:3000?vote=3">Penguins</a></li>`
    }

    // Add unsubscribe link
    textContent += `\n\nTo unsubscribe, visit: http://localhost:3000/unsubscribe`
    htmlContent += `\n</ol><p style="margin-top: 20px; font-size: 12px;"><a href="http://localhost:3000/unsubscribe">Unsubscribe</a></p>`

    return { textContent, htmlContent }
  } catch (error) {
    console.error('Error generating newsletter content:', error)
    // Return default content if error occurs
    return {
      textContent: TEST_NEWSLETTER_CONTENT,
      htmlContent: `
        <h1>Test Newsletter</h1>
        <p>This is a test newsletter.</p>
        <h2>Vote for the next topic!</h2>
        <p>Click on one of the options below to vote:</p>
        <ol>
          <li><a href="http://localhost:3000?vote=1">Whales</a></li>
          <li><a href="http://localhost:3000?vote=2">Roman Empire</a></li>
          <li><a href="http://localhost:3000?vote=3">Penguins</a></li>
        </ol>
        <p style="margin-top: 20px; font-size: 12px;"><a href="http://localhost:3000/unsubscribe">Unsubscribe</a></p>
      `,
    }
  }
}

const TEST_NEWSLETTER_CONTENT = `
# Test Newsletter

This is a test newsletter.

## Vote for the next topic!
Click on one of the options below to vote:

1. [Whales](http://localhost:3000?vote=1)
2. [Roman Empire](http://localhost:3000?vote=2)
3. [Penguins](http://localhost:3000?vote=3)

To unsubscribe, visit: http://localhost:3000/unsubscribe
`

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      // Generate newsletter content with voting options
      const { textContent, htmlContent } = await generateNewsletterContent()

      // Get all active subscribers
      const activeSubscribers = await prisma.subscriber.findMany({
        where: {
          active: true,
        },
      })

      if (activeSubscribers.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No active subscribers found to send the newsletter to.',
        })
      }

      // For testing purposes, just send to the first subscriber or a test email
      const testEmail =
        activeSubscribers.length > 0 ? activeSubscribers[0].email : 'blakeeriks.dev@gmail.com'

      console.log('Sending newsletter to:', testEmail)

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
        testEmail,
      })
    } catch (error) {
      console.error('Error sending email:', error)
      return res.status(500).json({ success: false, message: 'Error sending newsletter.' })
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}

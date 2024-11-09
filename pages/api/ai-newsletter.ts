import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { NextApiRequest, NextApiResponse } from 'next'
const sesClient = new SESClient({ region: process.env.AWS_REGION })

const TEST_NEWSLETTER_CONTENT = `
# Test Newsletter

This is a test newsletter.
`

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const params = {
      Source: 'blakeeriks.dev@gmail.com', // Verified email in SES
      Destination: {
        ToAddresses: ['blakeeriks.dev@gmail.com'], // Replace with your test email
      },
      Message: {
        Subject: { Data: 'Test Newsletter' },
        Body: {
          Text: { Data: TEST_NEWSLETTER_CONTENT },
        },
      },
    }

    try {
      const data = await sesClient.send(new SendEmailCommand(params))
      console.log('Email sent successfully', data)
      return res.status(200).json({ success: true, message: 'Newsletter sent!' })
    } catch (error) {
      console.error('Error sending email:', error)
      return res.status(500).json({ success: false, message: 'Error sending newsletter.' })
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}

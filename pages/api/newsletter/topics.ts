import { PrismaClient } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET - Fetch topics
  if (req.method === 'GET') {
    const { status } = req.query

    try {
      // Using mapped model name from schema
      const topics = await prisma.newsletterTopic.findMany({
        where: status ? {
          status: status.toString().toUpperCase() as any
        } : undefined,
        orderBy: [
          { votes: 'desc' },
          { createdAt: 'desc' }
        ]
      })

      return res.status(200).json({
        success: true,
        data: topics,
      })
    } catch (error) {
      console.error('Error fetching topics:', error)
      return res.status(500).json({ success: false, message: 'Failed to fetch topics' })
    }
  }

  // POST - Create a new topic
  if (req.method === 'POST') {
    const { title, description, status = 'SUGGESTED' } = req.body

    if (!title) {
      return res.status(400).json({ success: false, message: 'Topic title is required' })
    }

    try {
      // Create the new topic using the correct model
      const newTopic = await prisma.newsletterTopic.create({
        data: {
          title,
          description: description || null,
          status: status.toUpperCase() as any
        }
      })

      return res.status(201).json({
        success: true,
        data: newTopic,
        message: 'Topic created successfully',
      })
    } catch (error) {
      console.error('Error creating topic:', error)
      return res.status(500).json({ success: false, message: 'Failed to create topic' })
    }
  }

  // Method not allowed
  return res.status(405).json({ success: false, message: 'Method not allowed' })
}

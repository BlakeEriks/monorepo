import { Fields, Files, IncomingForm } from 'formidable'
import { promises as fs } from 'fs'
import { NextApiRequest, NextApiResponse } from 'next'
import { saveClippings } from '../../lib/kindle-clippings'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const form = new IncomingForm()

    const [fields, files] = await new Promise<[Fields, Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err)
        resolve([fields, files])
      })
    })

    const userIdField = fields.userId
    if (!userIdField) {
      return res.status(400).json({ error: 'User ID is required' })
    }

    const userId =
      typeof userIdField === 'string' ? parseInt(userIdField) : parseInt(userIdField[0])

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid User ID' })
    }

    const fileField = files.file
    if (!fileField) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const file = Array.isArray(fileField) ? fileField[0] : fileField
    const filePath = file.filepath
    const fileContent = await fs.readFile(filePath, 'utf8')

    const result = await saveClippings(fileContent, userId)

    return res.status(200).json({ success: true, count: result.count })
  } catch (error) {
    console.error('Error processing Kindle clippings:', error)
    return res.status(500).json({ error: 'Failed to process file' })
  }
}

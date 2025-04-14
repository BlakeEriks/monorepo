import { NextApiRequest, NextApiResponse } from 'next'
import { handleNewElectionCycle } from './select-topics'

/**
 * API endpoint to trigger a new election cycle.
 * This will:
 * 1. Find the current winner and mark it as PUBLISHED
 * 2. Select 3 new random topics for the next election
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  try {
    const result = await handleNewElectionCycle()

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'New election cycle started successfully',
        selectedTopicIds: result.selectedTopicIds,
      })
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to start new election cycle',
        error: result.error,
      })
    }
  } catch (error: unknown) {
    console.error('Error handling new election cycle:', error)
    return res.status(500).json({
      success: false,
      message: 'Error processing request',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

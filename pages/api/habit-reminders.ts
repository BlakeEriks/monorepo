import { getAllUsers } from '@/lib/db/user'
import habitBot from '@/lib/telegram/bots/habitBot/habitBot'
import { NotionHabitDatabase } from '@/lib/util/notion/NotionHabitDatabase'
import { formatInTimeZone } from 'date-fns-tz'
import type { NextApiRequest, NextApiResponse } from 'next'

const DEFAULT_TIMEZONE = 'America/New_York'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!process.env.NOTION_API_KEY) {
    return res.status(500).json({ message: 'NOTION_API_KEY is not set' })
  }

  try {
    for (const {
      telegramId,
      habitDatabaseId,
      timezone = DEFAULT_TIMEZONE,
    } of await getAllUsers()) {
      if (!telegramId || !habitDatabaseId) continue

      const habitDatabase = await new NotionHabitDatabase(
        process.env.NOTION_API_KEY,
        habitDatabaseId
      )

      // Get current hour in user's timezone
      const userLocalHour = parseInt(formatInTimeZone(new Date(), timezone, 'H'))

      const habits = await habitDatabase.getHabits()
      for (const { reminders = [], name } of habits) {
        if (reminders.some(reminder => reminder === userLocalHour)) {
          await habitBot.telegram.sendMessage(telegramId, `Reminder for habit: ${name}`)
        }
      }
    }
    return res.status(200).json({ message: 'Success' })
  } catch (e) {
    console.error('Error processing update:', e)
    return new Response('Error processing update', { status: 500 })
  }
}

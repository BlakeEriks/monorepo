import { getAllUsers } from '@/lib/db/user'
import habitBot from '@/lib/telegram/bots/habitBot/habitBot'
import { NotionHabitDatabase, NotionPropertyType } from '@/lib/util/notion/NotionHabitDatabase'
import { User } from '@prisma/client'
import { subDays } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import type { NextApiRequest, NextApiResponse } from 'next'

const DEFAULT_TIMEZONE = 'America/New_York'
const HABIT_STATUS_TIME = 5

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!process.env.NOTION_API_KEY) {
    return res.status(500).json({ message: 'NOTION_API_KEY is not set' })
  }

  try {
    for (const user of await getAllUsers()) {
      if (!user.telegramId || !user.habitDatabaseId) continue

      const habitDatabase = await new NotionHabitDatabase(
        process.env.NOTION_API_KEY,
        user.habitDatabaseId
      )

      // Get current hour in user's timezone
      const userLocalHour = parseInt(formatInTimeZone(new Date(), user.timezone, 'H'))

      // Only send status at 5am
      if (userLocalHour === HABIT_STATUS_TIME) await sendHabitStatus(habitDatabase, user)
    }
    return res.status(200).json({ message: 'Success' })
  } catch (e) {
    console.error('Error processing update:', e)
    return new Response('Error processing update', { status: 500 })
  }
}

const sendHabitStatus = async (habitDatabase: NotionHabitDatabase, { telegramId, name }: User) => {
  const habits = await habitDatabase.getHabits()

  // Get dates for the two periods we want to compare
  const twoWeeksAgo = subDays(new Date(), 15)
  const oneWeekAgo = subDays(new Date(), 7)

  // Get pages for both periods
  const recentPages = await habitDatabase.getRecentPages(15, twoWeeksAgo)

  // Split pages into previous week and current week
  const previousWeekPages = recentPages.filter(page => {
    const date = new Date((page.properties.Date as any).date.start)
    return date >= twoWeeksAgo && date < oneWeekAgo
  })

  const currentWeekPages = recentPages.filter(page => {
    const date = new Date((page.properties.Date as any).date.start)
    return date >= oneWeekAgo
  })

  const messages = [`📊 Weekly Habit Report`]
  const rows = []

  for (const habit of habits) {
    const { type, name: habitName, fullName } = habit

    switch (type) {
      case NotionPropertyType.DATE: {
        // Get time values for both weeks
        const prevWeekTimes = previousWeekPages
          .map(page => (page.properties[fullName] as any)?.date?.start)
          .filter(Boolean)
          .map(date => date.split('T')[1].substring(0, 5))

        const currentWeekTimes = currentWeekPages
          .map(page => (page.properties[fullName] as any)?.date?.start)
          .filter(Boolean)
          .map(date => date.split('T')[1].substring(0, 5))

        if (currentWeekTimes.length === 0) continue

        const prevAvg =
          prevWeekTimes.length > 0 ? timeStringToMinutes(averageTime(prevWeekTimes)) : null
        const currAvg = timeStringToMinutes(averageTime(currentWeekTimes))
        const change = prevAvg ? Math.round(((currAvg - prevAvg) / prevAvg) * 100) : null

        rows.push(
          `${habitName.padEnd(15)} ${minutesToTimeString(currAvg)} ${
            change !== null ? `${change > 0 ? '↑' : '↓'}${Math.abs(change)}%` : '---'
          }`
        )
        break
      }

      case NotionPropertyType.NUMBER: {
        const prevWeekNums = previousWeekPages
          .map(page => (page.properties[fullName] as any)?.number)
          .filter(num => num !== undefined && num !== null)

        const currentWeekNums = currentWeekPages
          .map(page => (page.properties[fullName] as any)?.number)
          .filter(num => num !== undefined && num !== null)

        if (currentWeekNums.length === 0) continue

        const prevAvg =
          prevWeekNums.length > 0
            ? prevWeekNums.reduce((a, b) => a + b, 0) / prevWeekNums.length
            : null
        const currAvg = currentWeekNums.reduce((a, b) => a + b, 0) / currentWeekNums.length
        const change = prevAvg ? Math.round(((currAvg - prevAvg) / prevAvg) * 100) : null

        rows.push(
          `${habitName.padEnd(15)} ${currAvg.toFixed(1).padStart(5)} ${
            change !== null ? `${change > 0 ? '↑' : '↓'}${Math.abs(change)}%` : '---'
          }`
        )
        break
      }

      case NotionPropertyType.CHECKBOX: {
        const prevWeekChecks = previousWeekPages
          .map(page => (page.properties[fullName] as any)?.checkbox)
          .filter(Boolean)

        const currentWeekChecks = currentWeekPages
          .map(page => (page.properties[fullName] as any)?.checkbox)
          .filter(Boolean)

        if (currentWeekChecks.length === 0) continue

        const prevRate =
          prevWeekChecks.length > 0
            ? (prevWeekChecks.length / previousWeekPages.length) * 100
            : null
        const currRate = (currentWeekChecks.length / currentWeekPages.length) * 100
        const change = prevRate ? Math.round(currRate - prevRate) : null

        rows.push(
          `${habitName.padEnd(15)} ${Math.round(currRate).toString().padStart(5)}% ${
            change !== null ? `${change > 0 ? '↑' : '↓'}${Math.abs(change)}%` : '---'
          }`
        )
        break
      }
    }
  }

  if (rows.length > 0) {
    messages.push('```')
    messages.push('Habit           Curr   WoW')
    messages.push('―――――――――――――――――――――――')
    messages.push(rows.join('\n'))
    messages.push('```')
    await habitBot.telegram.sendMessage(telegramId!, messages.join('\n'), {
      parse_mode: 'MarkdownV2',
    })
  }
}

function timeStringToMinutes(timeString: string) {
  const [hours, minutes] = timeString.split(':').map(Number)
  return hours * 60 + minutes
}

function minutesToTimeString(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

function averageTime(times: string[]) {
  const totalMinutes = times.reduce((sum, time) => sum + timeStringToMinutes(time), 0)
  const averageMinutes = totalMinutes / times.length
  return minutesToTimeString(Math.round(averageMinutes))
}

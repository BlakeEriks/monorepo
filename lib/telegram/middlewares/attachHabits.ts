// import { PrismaClient } from '@prisma/client'/
import { NotionHabitDatabase } from '@/lib/util/notion/NotionHabitDatabase'
import type { MiddlewareFn } from 'telegraf'
import type { HabitContext } from '../types'

// const prisma = new PrismaClient()

// Middleware to attach user to request
const attachHabits: MiddlewareFn<HabitContext> = async (ctx, next) => {
  if (!ctx.user) return await next()

  try {
    if (!process.env.NOTION_API_KEY) throw new Error('NOTION_API_KEY is not set')
    if (!ctx.user.habitDatabaseId) throw new Error('User has no habit database ID')

    ctx.habitDatabase = new NotionHabitDatabase(
      process.env.NOTION_API_KEY,
      ctx.user.habitDatabaseId
    )
    return next()
  } catch (error) {
    console.error('Error attaching habits to request:', error)
    return await next()
  }
}

export default attachHabits

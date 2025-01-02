import type { Quote, User } from '@prisma/client'
import type { Context, Scenes } from 'telegraf'
import { HabitProperty, NotionHabitDatabase } from '../util/notion/NotionHabitDatabase'

/* Habit types */
// type HabitWithReminders = Prisma.HabitGetPayload<{
//   include: { reminders: true }
// }>

interface HabitSession extends Scenes.SceneSession {
  step: number
  habit?: HabitProperty
  recentValues: Record<string, string[]>
  habitMeta: Record<string, HabitMeta>
  // currentHabit: number
  // habitLogs: Prisma.HabitLogCreateManyInput[]
}

interface HabitMeta {
  recentValues: string[]
  lastRecorded: Date
  streak: number
}

export interface HabitContext extends Context {
  user: User
  habitDatabase: NotionHabitDatabase
  session: HabitSession
  scene: Scenes.SceneContextScene<HabitContext>
}

// export interface HabitContext extends Context {
//   user: User
//   habits: HabitWithReminders[]
//   session: HabitSession
//   scene: Scenes.SceneContextScene<HabitContext>
// }

export interface HabitCommand {
  name: string
  description: string
  action: (ctx: HabitContext) => void
}

/* Quippet types */
interface QuippetSession extends Scenes.SceneSession {
  expecting: keyof Quote
  // quote: Partial<Quote>
}

export interface QuippetContext extends Context {
  user: User
  session: QuippetSession
  scene: Scenes.SceneContextScene<QuippetContext>
}

export interface QuippetCommand {
  name: string
  description: string
  action: (ctx: QuippetContext) => void
}

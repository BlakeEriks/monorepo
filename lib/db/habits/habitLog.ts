import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({})

export const getLatestHabitLog = (userId: number) =>
  prisma.habitLog.findFirst({
    where: { habit: { userId } },
    orderBy: { date: 'desc' },
  })

export const getHabitLogsSince = (userId: number, date: Date) =>
  prisma.habitLog.findMany({
    where: { habit: { userId }, date: { gte: date } },
  })

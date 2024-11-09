import { PrismaClient } from '@prisma/client'
import type { MiddlewareFn } from 'telegraf'
import type { HabitContext } from '../types'

const prisma = new PrismaClient()

const saveMessage: MiddlewareFn<HabitContext> = async (ctx, next) => {
  const { user, message } = ctx
  if (!message || !('text' in message)) return next()

  const created = new Date(message.date * 1000)

  try {
    await prisma.message.create({
      data: {
        text: message.text,
        created,
        user: {
          connect: {
            id: user.id,
          },
        },
      },
    })

    return next()
  } catch (error) {
    console.error('Error persisting message:', error)
  }
}

export default saveMessage

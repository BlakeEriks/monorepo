import { PrismaClient } from '@prisma/client'
import type { MiddlewareFn } from 'telegraf'
import type { HabitContext, QuippetContext } from '../types'

const prisma = new PrismaClient()

// Middleware to attach user to request
const attachUser: MiddlewareFn<HabitContext | QuippetContext> = async (ctx, next) => {
  console.log('attachUser', ctx.message)
  const from = ctx.message?.from || ctx.callbackQuery?.from

  if (!from) {
    console.log('ERROR: No `from`, skipping attachUser')
    return await next()
  }

  const { id, first_name: name } = from
  const telegramId = String(id)

  try {
    let user = await prisma.user.findFirst({
      where: { telegramId },
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId,
          name,
        },
      })
      console.log('User created for: ', name, ', ', id)
    }

    // Attach user to the request object
    ctx.user = user
    return next()
  } catch (error) {
    console.error('Error attaching user to request:', error)
  }
}

export default attachUser

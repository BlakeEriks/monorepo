import { PrismaClient } from '@prisma/client'
import type { MiddlewareFn } from 'telegraf'
import { ProteinContext } from '../bots/proteinBot/proteinBot'
import type { HabitContext, HabitSheetContext, QuippetContext } from '../types'

const prisma = new PrismaClient()

// Middleware to attach user to request
const attachUser: MiddlewareFn<
  HabitContext | QuippetContext | HabitSheetContext | ProteinContext
> = async (ctx, next) => {
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

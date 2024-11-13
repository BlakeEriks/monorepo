import { updateUser } from '@/lib/db/user'
import { replyAndLeave } from '@/lib/util/telegraf'
import { Scenes } from 'telegraf'
import { message } from 'telegraf/filters'
import type { HabitContext } from '../../types'

// Timezone Scene
export const SET_DATABASE_ID_SCENE = 'SET_DATABASE_ID_SCENE'
export const setDatabaseIdScene = new Scenes.BaseScene<HabitContext>(SET_DATABASE_ID_SCENE)
setDatabaseIdScene.enter(async ctx =>
  ctx.reply('Please enter your Notion Habit Database ID.\n\nOr go /back')
)
setDatabaseIdScene.command('back', replyAndLeave('Cancelled database ID setup.'))

setDatabaseIdScene.on(message('text'), async ctx => {
  const habitDatabaseId = ctx.message.text
  if (isValidDatabaseId(habitDatabaseId)) {
    await updateUser(ctx.user.id, { habitDatabaseId })
    return replyAndLeave(`Database ID set!`)(ctx)
  } else {
    return ctx.reply('Invalid database ID selection.')
  }
})

const isValidDatabaseId = (databaseId: string) => {
  return databaseId.replaceAll('-', '').length === 32
}

export default setDatabaseIdScene

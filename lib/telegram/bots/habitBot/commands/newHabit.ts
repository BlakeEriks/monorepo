import type { HabitContext } from '@/lib/telegram/types'
import { HabitProperty, NotionPropertyType } from '@/lib/util/notion/NotionHabitDatabase'
import { replyAndLeave } from '@/lib/util/telegraf'
import { Markup, Scenes } from 'telegraf'
import { message } from 'telegraf/filters'

type HabitDataType = {
  id: HabitProperty['type']
  name: string
  emoji: string
}

const HABIT_DATA_TYPES: HabitDataType[] = [
  {
    id: NotionPropertyType.NUMBER,
    name: 'Number',
    emoji: '🔢',
  },
  {
    id: NotionPropertyType.CHECKBOX,
    name: 'Yes/No',
    emoji: '🔘',
  },
  {
    id: NotionPropertyType.DATE,
    name: 'Time',
    emoji: '⏰',
  },
]

export const NEW_HABIT_SCENE = 'NEW_HABIT_SCENE'

enum NEW_HABIT_STEPS {
  NAME,
  EMOJI,
  TYPE,
}

export const newHabitScene = new Scenes.BaseScene<HabitContext>(NEW_HABIT_SCENE)

newHabitScene.enter(ctx => {
  ctx.session.step = NEW_HABIT_STEPS.NAME
  ctx.session.habit = {} as HabitProperty
  return ctx.reply(`What is the name of the habit you would like to track?\n\nOr go /back`)
})

newHabitScene.command('back', replyAndLeave('Cancelled habit creation.'))

newHabitScene.on(message('text'), async ctx => {
  if (!ctx.session.habit) throw new Error('No habit in session')

  switch (ctx.session.step) {
    case NEW_HABIT_STEPS.NAME:
      ctx.session.habit!.name = ctx.message.text
      ctx.session.step = NEW_HABIT_STEPS.EMOJI
      return ctx.reply('What emoji will represent this habit?')
    case NEW_HABIT_STEPS.EMOJI:
      if (!isEmoji(ctx.message.text)) return ctx.reply('Invalid emoji. Please try again.')

      ctx.session.habit.emoji = ctx.message.text
      ctx.session.step = NEW_HABIT_STEPS.TYPE
      return ctx.reply('What type of data will this habit track?', getHabitDataTypeKeyboard())
    case NEW_HABIT_STEPS.TYPE:
      ctx.session.habit.type = HABIT_DATA_TYPES.find(
        ({ emoji, name }) => emoji + ' ' + name === ctx.message.text
      )!.id

      const { name, emoji, type } = ctx.session.habit

      await ctx.habitDatabase.addNewHabit(name, emoji, type)
      return replyAndLeave(`Habit '${ctx.session.habit.name}' tracking setup complete!`)(ctx)
    default:
      return ctx.reply('ERROR - Invalid response', Markup.removeKeyboard())
  }
})

const getHabitDataTypeKeyboard = () =>
  Markup.keyboard([HABIT_DATA_TYPES.map(type => type.emoji + ' ' + type.name)])
    .oneTime()
    .resize()

const isEmoji = (str: string) => {
  const emojiRegex = /[\p{Emoji_Presentation}\p{Emoji}\uFE0F]/u
  return emojiRegex.test(str)
}

import { NotionPropertyType } from '@/lib/util/notion/NotionHabitDatabase'
import { Markup } from 'telegraf'
import { HabitContext } from '../../types'

export const getHabitKeyboard = async (ctx: HabitContext) => {
  const habits = await ctx.habitDatabase?.getHabits()
  if (!habits) return

  // Arrange buttons in rows of 3
  const keyboard = Markup.keyboard(
    habits.reduce((rows: any[], { name }, index) => {
      if (index % 3 === 0) rows.push([name])
      else rows[rows.length - 1].push(name)
      return rows
    }, [])
  )

  return keyboard
}

// export const escapeMarkdown = (text: string): string => {
//   // Escape special Markdown V2 characters, excluding asteris
//   return text.replace(/[_[\]()~`>#+-=|{}.!]/g, '\\$&')
// }

export const DEFAULT_MESSAGE = `
*🤖 Beep Boop\\!*

> I am the habit tracking bot\\!
> I can help you stay accountable to your habits\\.
`

export const getDefaultReply = async (ctx: HabitContext) => {
  return ctx.replyWithMarkdownV2(
    await getTodayHabitsMarkdown(ctx),
    await getHabitsInlineKeyboard(ctx)
  )
}

export const getHabitsInlineKeyboard = async (ctx: HabitContext) => {
  return Markup.inlineKeyboard(await getHabitKeyboardButtons(ctx))
}

export const getHabitKeyboardButtons = async (ctx: HabitContext) => {
  const habits = await ctx.habitDatabase?.getHabits()
  if (!habits) throw new Error('No habits')

  // Create compact buttons, multiple habits per row
  const flatButtons = habits.flatMap(({ emoji, id }) => [
    Markup.button.callback(emoji, `habit_detail_${id}`),
  ])

  // Group buttons into rows of 4 (8 buttons total - 4 habits worth of buttons per row)
  const buttons = []
  for (let i = 0; i < flatButtons.length; i += 8) {
    buttons.push(flatButtons.slice(i, i + 8))
  }
  buttons.push([Markup.button.callback('➕ New Habit', 'details')])

  return buttons
}

export const getTodayHabitsMarkdown = async (ctx: HabitContext) => {
  const todayPage = await ctx.habitDatabase?.getTodayPage()
  const todayProperties = todayPage?.properties ?? {}
  const habits = await ctx.habitDatabase?.getHabits()

  const habitLog = habits
    .map(({ text, name, emoji }) => {
      const property = todayProperties[name]
      let status = '□\u200B Not done'

      if (property) {
        switch (property.type) {
          case NotionPropertyType.DATE:
            status = property.date?.start ? '■ Completed' : '□ Not done'
            break
          case NotionPropertyType.CHECKBOX:
            status = property.checkbox ? '■ Completed' : '□ Not done'
            break
          case NotionPropertyType.NUMBER:
            status = `□ ${property.number ?? 0} reps`
            break
        }
      }

      const paddedText = text.padEnd(20, ' ')
      return `${emoji} ${paddedText}\t${status}`
    })
    .join('\n')

  return `\`\`\`TODAY\n${habitLog}\`\`\`\n\n`
}

export const getHabitDetailButtons = async (habitId: string) => [
  [Markup.button.callback('🔙', 'go_back')],
  [Markup.button.callback('⊕ New Reminder', `habit_new_reminder_${habitId}`)],
]

export const getTimeSelectionKeyboard = (habitId: string) => {
  const buttons = []
  for (let i = 0; i < 24; i += 4) {
    const row = []
    for (let j = i; j < Math.min(i + 4, 24); j++) {
      const hour = j.toString().padStart(2, '0')
      row.push(Markup.button.callback(`${hour}:00`, `set_reminder_${habitId}_${hour}`))
    }
    buttons.push(row)
  }
  buttons.push([Markup.button.callback('🔙 Back', `habit_detail_${habitId}`)])
  return buttons
}

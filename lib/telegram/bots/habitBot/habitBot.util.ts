import { NotionPropertyType } from '@/lib/util/notion/NotionHabitDatabase'
import { Markup } from 'telegraf'
import { HabitContext } from '../../types'

export enum BooleanOption {
  YES = '✅ Yes',
  NO = '❌ No',
}

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
  const habits = (await ctx.habitDatabase?.getHabits()) ?? []

  // // Create compact buttons, multiple habits per row
  const flatButtons = habits.flatMap(({ emoji, id }) => [
    Markup.button.callback(emoji, `habit_detail_${id}`),
  ])

  // Group buttons into rows of 4 (8 buttons total - 4 habits worth of buttons per row)
  const buttons = []
  for (let i = 0; i < flatButtons.length; i += 8) {
    buttons.push(flatButtons.slice(i, i + 8))
  }
  buttons.push([
    Markup.button.callback('➕ New Habit', 'new_habit'),
    Markup.button.callback('📍 Timezone', 'set_timezone'),
  ])

  return buttons
}

export const getTodayHabitsMarkdown = async (ctx: HabitContext) => {
  const todayPage = await ctx.habitDatabase?.getTodayPage()
  const todayProperties = todayPage?.properties ?? {}
  const habits = await ctx.habitDatabase?.getHabits()
  const { timezone } = ctx.user

  const dateHeader = new Date()
    .toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: timezone,
    })
    // Replace spaces with non-breaking space
    .replace(/\s+/g, '\u00A0')

  const habitLog = habits
    .map(({ text, fullName, emoji, id }) => {
      const property = todayProperties[fullName]
      const { recentValues, streak, lastRecorded } = ctx.session.habitMeta[id] ?? {}
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

      const streakDisplay = streak > 0 ? ` 🔥${streak}` : ''
      const paddedText = `${text} ${streakDisplay}`.padEnd(20, ' ')
      const formatted = `${emoji} ${paddedText}\t${status}`

      return formatted
    })
    .join('\n')

  return `\`\`\`${dateHeader}\n${habitLog}\`\`\``
}

export const getHabitDetailButtons = async (habitId: string) => [
  [
    Markup.button.callback('⬅️ Back', 'go_back'),
    Markup.button.callback('❌ Delete', `habit_delete_${habitId}`),
  ],
  [
    Markup.button.callback('🟢 Add Reminder', `habit_new_reminder_${habitId}`),
    Markup.button.callback('🔴 Clear Reminders', `habit_clear_reminders_${habitId}`),
  ],
]

export const getTimeSelectionKeyboard = (habitId: string) => {
  const buttons = []
  for (let i = 0; i < 24; i += 4) {
    const row = []
    for (let j = i; j < Math.min(i + 4, 24); j++) {
      const hour = j.toString().padStart(2, '0')
      row.push(Markup.button.callback(`${hour}:00`, `habit_set_reminder_${habitId}_${hour}`))
    }
    buttons.push(row)
  }
  buttons.push([Markup.button.callback('⬅️ Back', `habit_detail_${habitId}`)])
  return buttons
}

export const getBooleanKeyboard = () => {
  return Markup.keyboard([[BooleanOption.YES, BooleanOption.NO]])
}

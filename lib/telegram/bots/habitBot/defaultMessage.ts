import { NotionPropertyType } from '@/lib/util/notion/NotionHabitDatabase'
import { HabitContext } from '../../types'
import { HABIT_COMMANDS } from './commands'

export const commandGroups = [{ name: 'Habit Commands', commands: HABIT_COMMANDS }]

const availableCommands = commandGroups.map(group => {
  return `${group.name}:\n${group.commands
    .map(({ name, description }) => `  /${name} - ${description}`)
    .join('\n')}`
})

const DEFAULT_MESSAGE = `
🤖 Beep Boop! 

I am the habit tracking bot!
I can help you stay accountable to your habits.

${availableCommands.join('\n\n')}
`

export const getDefaultMessage = async (ctx: HabitContext) => {
  if (!ctx.habitDatabase) {
    return DEFAULT_MESSAGE
  }

  const habits = await ctx.habitDatabase.getHabits()
  if (habits.length === 0) {
    return DEFAULT_MESSAGE
  }

  const todayPage = await ctx.habitDatabase?.getTodayPage()
  const todayProperties = todayPage?.properties ?? {}

  const todayHabitsDisplay = habits.map(({ text, name, emoji }) => {
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

  // Escape special characters for MarkdownV2
  const escapedDefaultMessage = DEFAULT_MESSAGE.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&')

  return `${escapedDefaultMessage}\n\n\`\`\`TODAY\n${todayHabitsDisplay.join('\n')}\`\`\``
}

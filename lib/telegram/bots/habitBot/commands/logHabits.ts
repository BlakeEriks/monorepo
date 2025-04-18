// import moment from 'moment-timezone'

// import { saveHabitLogs } from '@/lib/db/habits'
// import { replyAndLeave } from '@/lib/util/telegraf'
// import type { Habit } from '@prisma/client'
// import { Markup, Scenes } from 'telegraf'
// import { message } from 'telegraf/filters'
// import type { HabitContext } from '../../types'

// const BOOLEAN_KEYBOARD_OPTIONS = ['Yes', 'No']
// export const LOG_HABITS_SCENE = 'LOG_HABITS_SCENE'
// const logHabitsScene = new Scenes.BaseScene<HabitContext>(LOG_HABITS_SCENE)

// logHabitsScene.enter(async ctx => {
//   if (!ctx.habits.length) {
//     return replyAndLeave('You have no habits to log. Create a habit first with /new_habit')(ctx)
//   }
//   ctx.session.habitLogs = []
//   ctx.session.currentHabit = 0
//   promptForHabitData(ctx)
// })

// logHabitsScene.command('back', replyAndLeave('Cancelled habit logging.'))

// logHabitsScene.on(message('text'), async ctx => {
//   const habit = ctx.habits[ctx.session.currentHabit]
//   const { text } = ctx.message

//   if (!validateHabitLog(habit, text)) {
//     return promptForHabitData(ctx)
//   }

//   const userDate = moment.tz(new Date(), ctx.user.timezone).toDate()

//   ctx.session.habitLogs.push({
//     habitId: habit.id,
//     value: text.toLowerCase(),
//     date: userDate,
//   })

//   return proceedToNextHabit(ctx)
// })

// const promptForHabitData = (ctx: HabitContext) => {
//   const currentHabit = ctx.habits[ctx.session.currentHabit]
//   let promptMessage = `Please provide data for the habit: ${currentHabit.name}\n`

//   switch (currentHabit.dataType) {
//     case 'bool':
//       promptMessage += 'Did you complete this habit today?'
//       return ctx.reply(
//         promptMessage,
//         Markup.keyboard([BOOLEAN_KEYBOARD_OPTIONS]).oneTime().resize()
//       )
//     case 'number':
//       promptMessage += 'Enter the value for this habit (number):'
//       break
//     case 'time':
//       promptMessage += 'Enter the time for this habit (HH:MM):'
//       break
//   }

//   return ctx.reply(promptMessage, Markup.removeKeyboard())
// }

// const proceedToNextHabit = async (ctx: HabitContext) => {
//   ctx.session.currentHabit++
//   if (ctx.session.currentHabit! < ctx.habits!.length) {
//     return promptForHabitData(ctx)
//   } else {
//     console.log('Saving habits ', ctx.session.habitLogs)
//     await saveHabitLogs(ctx.session.habitLogs)
//     return replyAndLeave('All habit data has been filled out. Thank you!')(ctx)
//   }
// }

// const isValidTime = (time: string): boolean => {
//   const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
//   return timeRegex.test(time)
// }

// const validateHabitLog = (habit: Habit, value: string) => {
//   switch (habit.dataType) {
//     case 'bool':
//       return BOOLEAN_KEYBOARD_OPTIONS.includes(value)
//     case 'number':
//       return !isNaN(Number(value))
//     case 'time':
//       return isValidTime(value)
//     default:
//       return false
//   }
// }

// export default logHabitsScene

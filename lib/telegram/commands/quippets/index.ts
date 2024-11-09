import { enterScene } from '@/lib/util/telegraf'
import type { HabitCommand } from '../../types'

import { NEW_BOOK_SCENE, newBookScene } from './newBook'
import { NEW_QUOTE_SCENE, newQuoteScene } from './newQuote'

export const QUOTE_SCENES = [newQuoteScene, newBookScene]

export const QUOTE_COMMANDS: HabitCommand[] = [
  // {
  //   name: 'list_habits',
  //   description: 'List the habits you are tracking',
  //   action: listHabits,
  // },
  {
    name: 'new_quote',
    description: 'Add a new quote to the database',
    action: enterScene(NEW_QUOTE_SCENE),
  },
  {
    name: 'add_book',
    description: 'Add a new book to the reading list',
    action: enterScene(NEW_BOOK_SCENE),
  },

  // {
  //   name: 'remove_habit',
  //   description: 'Remove a habit you are tracking',
  //   action: enterScene(REMOVE_HABIT_SCENE),
  // },
  // {
  //   name: 'log_habits',
  //   description: 'Log your habit data for today',
  //   action: enterScene(LOG_HABIT_SCENE),
  // },
  // {
  //   name: 'habit_summary',
  //   description: 'Check your recent habit performance',
  //   action: habitSummary,
  // },
]

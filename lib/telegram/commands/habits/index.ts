import type { BaseScene } from 'telegraf/scenes'
import type { HabitCommand, HabitContext } from '../../types'

import { enterScene } from '@/lib/util/telegraf'
import listHabits from './listHabits'
import logHabitScene, { LOG_HABIT_SCENE } from './logHabit'
import logHabitsScene, { LOG_HABITS_SCENE } from './logHabits'
import { NEW_HABIT_SCENE, newHabitScene } from './newHabit'
import removeHabitScene, { REMOVE_HABIT_SCENE } from './removeHabit'
import setDatabaseIdScene, { SET_DATABASE_ID_SCENE } from './setDatabaseId'
import habitSummary from './summarizeHabits'

export const HABIT_SCENES: BaseScene<HabitContext>[] = [
  setDatabaseIdScene,
  newHabitScene,
  removeHabitScene,
  logHabitScene,
  logHabitsScene,
]

export const HABIT_COMMANDS: HabitCommand[] = [
  {
    name: 'set_database_id',
    description: 'Set your Notion Habit Database ID',
    action: enterScene(SET_DATABASE_ID_SCENE),
  },
  {
    name: 'list_habits',
    description: 'List the habits you are tracking',
    action: listHabits,
  },
  {
    name: 'new_habit',
    description: 'Create a new habit to track',
    action: enterScene(NEW_HABIT_SCENE),
  },
  {
    name: 'remove_habit',
    description: 'Remove a habit you are tracking',
    action: enterScene(REMOVE_HABIT_SCENE),
  },
  {
    name: 'log_habits',
    description: 'Log your habit data for today',
    action: enterScene(LOG_HABITS_SCENE),
  },
  {
    name: 'log_habit',
    description: 'Log your habit data for today',
    action: enterScene(LOG_HABIT_SCENE),
  },
  {
    name: 'habit_summary',
    description: 'Check your recent habit performance',
    action: habitSummary,
  },
]

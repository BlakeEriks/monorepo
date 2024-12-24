/* eslint-disable @typescript-eslint/no-explicit-any */
import { Client } from '@notionhq/client'
import { GetDatabaseResponse, PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'

/** Enum representing the types of properties a habit can have in Notion. */
export enum NotionPropertyType {
  CHECKBOX = 'checkbox',
  NUMBER = 'number',
  DATE = 'date',
}

/** Represents a habit property in the Notion database. */
export class HabitProperty {
  id: string

  /** Full name of the habit */
  fullName: string

  /** Emoji and text of the habit */
  name: string
  type: NotionPropertyType

  /** Emoji of the habit */
  emoji: string

  /** Text of the habit */
  text: string
  reminders: number[]

  /**
   * Constructs a HabitProperty instance.
   *
   * Property is of the format: "[emoji] [text]@[reminder1],[reminder2],[reminder3]"
   * */
  constructor({ id, name, type }: GetDatabaseResponse['properties'][0]) {
    this.id = id
    this.type = type as NotionPropertyType
    this.fullName = name

    const [namePart, remindersPart] = name.split('@')
    this.name = namePart
    this.reminders = remindersPart ? remindersPart.split(',').map(Number) : []

    const [emoji, ...nameParts] = namePart.split(' ')
    this.text = nameParts.join(' ')
    this.emoji = emoji
  }
}

/** Manages interactions with a Notion database for habit tracking. */
export class NotionHabitDatabase {
  private notion: Client
  private databaseId: string
  private database: GetDatabaseResponse | null = null
  private todayPage: PageObjectResponse | null = null
  private NON_HABIT_PROPERTIES: readonly string[] = ['Date', 'Index']

  /** Constructs a NotionHabitDatabase instance. */
  constructor(notionApiKey: string, databaseId: string) {
    this.notion = new Client({ auth: notionApiKey })
    this.databaseId = databaseId
  }

  /** Retrieves the Notion database. */
  async getDatabase() {
    return (this.database ??= await this.notion.databases.retrieve({
      database_id: this.databaseId,
    }))
  }

  /** Retrieves all habit properties from the database. */
  async getHabits() {
    const database = await this.getDatabase()
    return Object.values(database.properties)
      .filter(({ name }) => !this.NON_HABIT_PROPERTIES.includes(name))
      .map(property => new HabitProperty(property))
  }

  /** Finds a habit by its emoji. */
  async getHabitByEmoji(emoji: string) {
    return (await this.getHabits()).find(habit => habit.emoji === emoji)
  }

  /** Finds a habit by its id. */
  async getHabitById(id: string) {
    return (await this.getHabits()).find(habit => habit.id === id)
  }

  /** Finds a habit by its name. */
  async getHabitByName(name: string) {
    return (await this.getHabits()).find(habit => habit.name === name)
  }

  /** Returns a formatted string of all habit names. */
  async prettyPrintHabits() {
    return (await this.getHabits()).map(({ name }) => name).join('\n')
  }

  /** Retrieves recent pages from the database. */
  async getRecentPages(limit = 10) {
    const response = await this.notion.databases.query({
      database_id: this.databaseId,
      sorts: [{ property: 'Date', direction: 'descending' }],
      page_size: limit,
    })
    return response.results as PageObjectResponse[]
  }

  /** Retrieves today's page from the database. */
  async getTodayPage() {
    return (this.todayPage ??= (await this.findTodayPage()).existingPage)
  }

  /** Logs a habit with a given value. */
  async logHabit(habitId: string, value: string) {
    const habit = await this.findHabitById(habitId)
    if (!habit) throw new Error(`Habit with id ${habitId} not found`)

    const validatedValue = this.validateHabitValue(value, habit.type)
    const { existingPage, nextPK } = await this.findTodayPage()
    const propertyPayload = this.createPropertyPayload(
      habit.type,
      validatedValue,
      existingPage?.properties[habit.name]
    )

    return this.upsertHabitLog(existingPage, habit.name, propertyPayload, nextPK)
  }

  /** Adds a new habit to the database. */
  async addNewHabit(text: string, emoji: string, type: NotionPropertyType) {
    const database = await this.getDatabase()
    const name = `${emoji} ${text}`

    if (database.properties[name]) {
      throw new Error(`Habit with name "${name}" already exists`)
    }

    const propertyTypes = {
      [NotionPropertyType.CHECKBOX]: { checkbox: {} },
      [NotionPropertyType.NUMBER]: { number: {} },
      [NotionPropertyType.DATE]: { date: {} },
    } as const

    await this.notion.databases.update({
      database_id: this.databaseId,
      properties: {
        [name]: propertyTypes[type],
      },
    })
  }

  /** Removes a habit from the database. */
  async removeHabit(habitName: string) {
    const database = await this.getDatabase()

    if (!database.properties[habitName]) {
      throw new Error(`Habit "${habitName}" does not exist`)
    }

    await this.notion.databases.update({
      database_id: this.databaseId,
      properties: {
        [habitName]: null,
      },
    })
  }

  /** Finds a habit by its ID. */
  private async findHabitById(id: string) {
    return Object.values(await this.getHabits()).find(prop => prop.id === id)
  }

  /** Validates the value of a habit based on its type. */
  private validateHabitValue(value: string, type: NotionPropertyType) {
    switch (type) {
      case 'checkbox':
        const boolValue = value.toLowerCase()
        if (boolValue !== 'true' && boolValue !== 'false') {
          throw new Error('Checkbox value must be "true" or "false"')
        }
        return boolValue === 'true'
      case 'number':
        const numValue = Number(value)
        if (isNaN(numValue)) {
          throw new Error('Number value must be numeric')
        }
        return numValue
      case 'date':
        if (isNaN(Date.parse(value))) {
          throw new Error('Date must be valid date string')
        }
        return value
      default:
        throw new Error(`Unsupported habit type: ${type}`)
    }
  }

  /** Finds today's page from a list of pages. */
  private async findTodayPage() {
    const latestPages = await this.getRecentPages(1)

    if (!latestPages.length) return { existingPage: null, nextPK: 1 }

    const [latestPage] = latestPages
    const dateProperty = latestPage.properties.Date as { date: { start: string } }
    const PK = (latestPage.properties.Index as { title: Array<{ text: { content: string } }> })
      .title[0].text.content

    return {
      existingPage: this.isSameLocalDate(new Date(dateProperty.date.start), new Date())
        ? latestPage
        : null,
      nextPK: Number(PK ?? 0) + 1,
    }
  }

  /** Creates a property payload for a habit. */
  private createPropertyPayload(type: NotionPropertyType, value: any, previousValue?: any) {
    switch (type) {
      case NotionPropertyType.CHECKBOX:
        return { checkbox: value }
      case NotionPropertyType.NUMBER:
        if (previousValue?.number) value += previousValue.number
        return { number: value }
      case NotionPropertyType.DATE:
        return { date: { start: value } }
      default:
        throw new Error(`Unsupported habit type: ${type}`)
    }
  }

  /** Upserts a habit log into the database. */
  private async upsertHabitLog(
    existingPage: PageObjectResponse | null,
    habitKey: string,
    payload: any,
    nextPK: number
  ) {
    if (existingPage) {
      return this.notion.pages.update({
        page_id: existingPage.id,
        properties: { [habitKey]: payload } as Record<string, any>,
      })
    }

    return this.notion.pages.create({
      parent: { database_id: this.databaseId },
      properties: {
        Index: { title: [{ text: { content: nextPK.toString() } }] },
        Date: { date: { start: this.getLocalDate(new Date()) } },
        [habitKey]: payload,
      } as Record<string, any>,
    })
  }

  /** Gets the local date in ISO format. */
  private getLocalDate(date: Date) {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().split('T')[0]
  }

  /** Checks if two dates are the same local date. */
  private isSameLocalDate(dateOne: Date, dateTwo: Date) {
    return dateOne.toISOString().split('T')[0] === this.getLocalDate(dateTwo)
  }

  /** Adds a reminder time to a habit */
  async addReminderToHabit(habitId: string, reminderHour: number) {
    const habit = await this.getHabitById(habitId)

    if (!habit) {
      throw new Error(`Habit "${habitId}" does not exist`)
    }

    if (reminderHour < 0 || reminderHour > 23) {
      throw new Error('Reminder hour must be between 0 and 23')
    }

    // If reminder already exists, don't add it again
    if (habit.reminders.includes(reminderHour)) {
      throw new Error(`Reminder for ${reminderHour}:00 already exists`)
    }

    // Add new reminder to the sorted list
    const newReminders = [...habit.reminders, reminderHour].sort((a, b) => a - b)

    // Construct new name with updated reminders
    const newName = `${habit.emoji} ${habit.text}@${newReminders.join(',')}`

    // Update the property in Notion
    this.database = await this.notion.databases.update({
      database_id: this.databaseId,
      properties: {
        [habit.fullName]: { name: newName },
      },
    })

    // console.log('res', res)

    // // Update the database cache to null so it will be refreshed on next get
    // = res
  }
}

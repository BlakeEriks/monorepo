/* eslint-disable @typescript-eslint/no-explicit-any */
import { Client } from '@notionhq/client'
import { GetDatabaseResponse, PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'

enum NotionPropertyType {
  CHECKBOX = 'checkbox',
  NUMBER = 'number',
  DATE = 'date',
}

export class HabitProperty {
  readonly id: string
  readonly name: string
  readonly type: NotionPropertyType
  readonly emoji: string
  readonly text: string

  constructor({ id, name, type }: GetDatabaseResponse['properties'][0]) {
    this.id = id
    this.name = name
    this.type = type as NotionPropertyType
    const [emoji, ...nameParts] = name.split(' ')
    this.emoji = emoji
    this.text = nameParts.join(' ')
  }
}

export class NotionHabitDatabase {
  private notion: Client
  private databaseId: string
  private database: GetDatabaseResponse | null = null
  private nonHabitProperties: readonly string[] = ['Date', 'Index']

  constructor(notionApiKey: string, databaseId: string) {
    this.notion = new Client({ auth: notionApiKey })
    this.databaseId = databaseId
  }

  async getDatabase() {
    return (this.database ??= await this.notion.databases.retrieve({
      database_id: this.databaseId,
    }))
  }

  async getHabits() {
    const database = await this.getDatabase()
    return Object.values(database.properties)
      .filter(({ name }) => !this.nonHabitProperties.includes(name))
      .map(property => new HabitProperty(property))
  }

  async prettyPrintHabits() {
    return (await this.getHabits()).map(({ name }) => name).join('\n')
  }

  async getRecentPages(limit = 10) {
    const response = await this.notion.databases.query({
      database_id: this.databaseId,
      sorts: [{ property: 'Date', direction: 'descending' }],
      page_size: limit,
    })
    return response.results as PageObjectResponse[]
  }

  async logHabit(habitId: string, value: string) {
    const habit = await this.findHabitById(habitId)
    if (!habit) throw new Error(`Habit with id ${habitId} not found`)

    const validatedValue = this.validateHabitValue(value, habit.type)
    const latestPages = await this.getRecentPages(1)
    const { existingPage, nextPK } = this.findTodayPage(latestPages)
    const propertyPayload = this.createPropertyPayload(
      habit.type,
      validatedValue,
      existingPage?.properties[habit.name]
    )

    return this.upsertHabitLog(existingPage, habit.name, propertyPayload, nextPK)
  }

  private async findHabitById(id: string) {
    return Object.values(await this.getHabits()).find(prop => prop.id === id)
  }

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

  private findTodayPage(pages: PageObjectResponse[]) {
    if (!pages.length) return { existingPage: null, nextPK: 1 }

    const [latestPage] = pages
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

  private getLocalDate(date: Date) {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().split('T')[0]
  }

  private isSameLocalDate(dateOne: Date, dateTwo: Date) {
    return dateOne.toISOString().split('T')[0] === this.getLocalDate(dateTwo)
  }
}

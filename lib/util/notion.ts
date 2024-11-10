/* eslint-disable @typescript-eslint/no-explicit-any */
import { Client } from '@notionhq/client'
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'
const READING_LIST_DATABASE_ID = '92b3e821-1cb9-4b34-86cd-a892ba2d3332'
const HABIT_DATABASE_ID = '139222ac-f954-80a0-b3dd-eba6cd28e9fe'

const notion = new Client({ auth: process.env.NOTION_API_KEY })

type Book = {
  title: string
  author?: string
  tags?: string[]
}

export const addBookToReadingList = async ({ tags = [], author = '', title }: Book) => {
  await notion.pages.create({
    parent: { database_id: READING_LIST_DATABASE_ID },
    properties: {
      Title: { title: [{ text: { content: title } }] },
      Author: { rich_text: [{ text: { content: author } }] },
      Tags: { multi_select: tags.map(tag => ({ name: tag })) },
    },
  })
}

export const getDatabase = (databaseId: string) =>
  notion.databases.retrieve({ database_id: databaseId })

type HabitPropertyValue = boolean | number | string

export const addHabitLog = async (emoji: string, value: any) => {
  const habitDatabase = await getDatabase(HABIT_DATABASE_ID)
  const { key: habitPropertyKey, property: habitProperty } = findHabitProperty(habitDatabase, emoji)

  // Validate the input value based on property type
  const validatedValue = validateHabitValue(value, habitProperty.type)

  const latestHabitPages = await getRecentHabitPages(HABIT_DATABASE_ID)

  // Find today's habit page if it exists
  const { existingPage, nextPK } = findExistingPage(latestHabitPages)

  // Create the property payload
  const previousPage = existingPage?.properties[habitPropertyKey]
  const propertyPayload = createPropertyPayload(habitProperty.type, validatedValue, previousPage)

  // Update or create the habit log
  await upsertPage(existingPage, habitPropertyKey, propertyPayload, nextPK)
}

const findHabitProperty = (habitDatabase: any, emoji: string) => {
  const propertyKey = Object.keys(habitDatabase.properties).find(key => key.startsWith(emoji))
  if (!propertyKey) throw new Error(`Habit property with emoji ${emoji} not found`)
  return {
    key: propertyKey,
    property: habitDatabase.properties[propertyKey],
  }
}

const validateHabitValue = (value: any, propertyType: string): HabitPropertyValue => {
  switch (propertyType) {
    case 'checkbox':
      if (typeof value !== 'boolean') throw new Error('Checkbox property must be a boolean')
      return value
    case 'number':
      if (typeof value !== 'number') throw new Error('Number property must be an integer')
      return value
    case 'date':
      if (typeof value !== 'string' || isNaN(new Date(value).getTime()))
        throw new Error('Date property must be a valid date string')
      return value
    default:
      throw new Error(`Unsupported habit property type: ${propertyType}`)
  }
}

const findExistingPage = (
  latestHabitPages: PageObjectResponse[]
): { existingPage: PageObjectResponse | null; nextPK: number } => {
  if (latestHabitPages.length === 0) return { existingPage: null, nextPK: 1 }

  const latestPage = latestHabitPages[0] as PageObjectResponse
  const dateProperty = latestPage.properties.Date as { date: { start: string } }
  const PK = (latestPage.properties.Index as { title: Array<{ text: { content: string } }> })
    .title[0].text.content

  return {
    existingPage: isSameLocalDate(new Date(dateProperty.date.start), new Date())
      ? latestPage
      : null,
    nextPK: Number(PK ?? 0) + 1,
  }
}

const getRecentHabitPages = async (databaseId: string) => {
  const response = await notion.databases.query({
    database_id: databaseId,
    sorts: [{ property: 'Date', direction: 'descending' }],
  })
  return response.results as PageObjectResponse[]
}

const createPropertyPayload = (
  type: string,
  value: HabitPropertyValue,
  previousValue?: PageObjectResponse['properties'][string]
) => {
  switch (type) {
    case 'checkbox':
      return { checkbox: value }
    case 'number':
      if (previousValue && 'number' in previousValue) (value as number) += previousValue.number ?? 0
      return { number: value }
    case 'date':
      return { date: { start: value } }
    default:
      throw new Error(`Unsupported habit property type: ${type}`)
  }
}

const upsertPage = async (
  existingPage: PageObjectResponse | null,
  habitPropertyKey: string,
  propertyPayload: any,
  nextPK: number
) => {
  if (existingPage) {
    await notion.pages.update({
      page_id: existingPage.id,
      properties: { [habitPropertyKey]: propertyPayload } as Record<string, any>,
    })
  } else {
    await notion.pages.create({
      parent: { database_id: HABIT_DATABASE_ID },
      properties: {
        Index: { title: [{ text: { content: nextPK.toString() } }] },
        Date: { date: { start: getLocalDate(new Date()) } },
        [habitPropertyKey]: propertyPayload,
      } as Record<string, any>,
    })
  }
}

const getLocalDate = (date: Date) => {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().split('T')[0]
}

const isSameLocalDate = (dateOne: Date, dateTwo: Date) => {
  console.log(dateOne.toISOString().split('T')[0], getLocalDate(dateTwo))
  return dateOne.toISOString().split('T')[0] === getLocalDate(dateTwo)
}

if (require.main === module) {
  addHabitLog('💪', 40).then(res => console.log(res))
}

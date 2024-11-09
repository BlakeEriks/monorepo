import { Client } from '@notionhq/client'

const READING_LIST_DATABASE_ID = '92b3e821-1cb9-4b34-86cd-a892ba2d3332'

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

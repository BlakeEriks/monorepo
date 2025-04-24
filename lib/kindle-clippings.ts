import { Book, Prisma } from '@prisma/client'
import prisma from './prisma'

export type Clipping = {
  source: string
  meta: string
  content: string
  createdAt: Date
}

export const parseClippings = (clippingsText: string): Clipping[] => {
  const clippings = clippingsText
    .split('==========')
    .map((entry) =>
      entry
        .trim()
        .split(/\r?\n/)
        .filter((data) => data.length)
    )
    .filter((entry) => entry.length >= 3) // Ensure we have source, meta and content

  const parsedClippings: Clipping[] = []

  for (const entry of clippings) {
    const source = entry[0]
    const meta = entry[1]
    const content = entry.slice(2).join('\n') // Content might span multiple lines

    if (!source || !meta || !content) continue

    const parts: string[] = meta.split(' | ')
    const inception = parts[parts.length - 1]
    const createdAt = inception && new Date(inception.replace('Added on ', ''))

    if (createdAt && content) {
      parsedClippings.push({
        source,
        meta: parts.slice(0, -1).join(' | '),
        content,
        createdAt,
      })
    }
  }

  return parsedClippings
}

// ex The 7 Habits of Highly Effective People (Covey, Stephen R.)
const parseSourceString = (sourceString: string) => {
  // Handle cases where the title might contain parentheses
  const lastOpenParenIndex = sourceString.lastIndexOf(' (')
  if (lastOpenParenIndex === -1) {
    return { title: sourceString, authorName: 'Unknown' }
  }

  const title = sourceString.substring(0, lastOpenParenIndex).trim()
  const author = sourceString
    .substring(lastOpenParenIndex + 2)
    .replace(/\)$/, '')
    .trim()

  // Covey, Stephen R.
  let authorName = author

  if (authorName.includes(', ')) {
    // Stephen R. Covey
    authorName = authorName.split(', ').reverse().join(' ')
  }

  return { title, authorName }
}

const createBookWithAuthor = async (sourceString: string) => {
  const { title, authorName } = parseSourceString(sourceString)
  return prisma.book.create({
    data: {
      source: sourceString,
      title,
      author: {
        connectOrCreate: {
          create: {
            name: authorName,
          },
          where: {
            name: authorName,
          },
        },
      },
    },
  })
}

export const saveClippings = async (clippingsString: string, userId: number) => {
  const clippings = parseClippings(clippingsString)
  const allBooks = await prisma.book.findMany()
  const sourceStrings = new Set(clippings.map(({ source }) => source))
  const allQuotesCreatedAts = new Set(
    (await prisma.quote.findMany()).map(({ createdAt }) => createdAt.toISOString())
  )

  // Create books from source strings if they don't yet exist
  for (const sourceString of Array.from(sourceStrings)) {
    // Skip if the book source string already exists
    if (allBooks.find((book: Book) => book.source === sourceString)) continue

    allBooks.push(await createBookWithAuthor(sourceString))
  }

  // Filter out quotes that already exist
  const filteredQuotes = clippings.filter(
    ({ createdAt }) => !allQuotesCreatedAts.has(createdAt.toISOString())
  )

  const createQuotesInput = filteredQuotes.map(
    ({ createdAt, meta, content, source }): Prisma.QuoteCreateManyInput => ({
      createdAt,
      meta,
      content,
      userId,
      bookId: allBooks.find((book: Book) => book.source === source)?.id,
    })
  )

  return prisma.quote.createMany({ data: createQuotesInput })
}

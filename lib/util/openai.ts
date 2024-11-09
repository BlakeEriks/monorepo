import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'

const Quote = z.object({
  content: z.string(),
  quotee: z.string().nullable(),
})

const client = new OpenAI()

const PARSE_QUOTE_SYSTEM_PROMPT = `Parse the provided text to extract the quote and the quotee.`

type ParseQuoteParams = {
  text?: string
  imageURL?: string
}

export const parseQuote = async ({ text, imageURL }: ParseQuoteParams) => {
  let messages: any[] = []
  if (text) {
    messages = [{ role: 'user', content: text }]
  } else if (imageURL) {
    messages = [
      { role: 'user', content: PARSE_QUOTE_SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: imageURL, detail: 'low' },
          },
        ],
      },
    ]
  } else {
    throw new Error('Either text or imageURL must be provided')
  }

  const response = await client.beta.chat.completions.parse({
    messages,
    model: 'gpt-4o-mini',
    response_format: zodResponseFormat(Quote, 'quote'),
  })

  const quote = response.choices[0].message
  if (quote.refusal || !quote.parsed) {
    throw new Error('Quote parsing failed')
  }

  console.log('Quote parsed:', quote.parsed)
  return quote.parsed
}

const BOOK_INFO_SYSTEM_PROMPT = `
Parse the provided text to extract the book title and author.

If the author is not provided but you know who wrote the book, fill it in.
Otherwise, leave it blank.

Apply any of the following tags to the book:
- Self-Improvement
- Fiction
- Non-Fiction
- Business
- Programming
- Psychology
- Philosophy
- Religion
- Science
`

const Book = z.object({
  title: z.string(),
  author: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export const getBookInfo = async (title: string) => {
  const response = await client.beta.chat.completions.parse({
    model: 'gpt-4o-mini',
    response_format: zodResponseFormat(Book, 'book'),
    messages: [
      { role: 'user', content: BOOK_INFO_SYSTEM_PROMPT },
      { role: 'user', content: title },
    ],
  })

  const book = response.choices[0].message
  if (book.refusal || !book.parsed) {
    throw new Error('Book parsing failed')
  }

  return book.parsed
}

import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { bookId, authorName } = req.body

    if (!bookId || typeof bookId !== 'number') {
      return res.status(400).json({ error: 'Valid book ID is required' })
    }

    if (!authorName || typeof authorName !== 'string' || !authorName.trim()) {
      return res.status(400).json({ error: 'Valid author name is required' })
    }

    // Get the book to check if it exists
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      include: { author: true },
    })

    if (!book) {
      return res.status(404).json({ error: 'Book not found' })
    }

    // Check if we're trying to update to the same name
    if (book.author.name === authorName.trim()) {
      return res.status(200).json({ message: 'No change needed' })
    }

    // Check if another author with this name already exists
    const existingAuthor = await prisma.author.findUnique({
      where: { name: authorName.trim() },
    })

    if (existingAuthor) {
      // If author exists, update the book to use the existing author
      await prisma.book.update({
        where: { id: bookId },
        data: {
          author: { connect: { id: existingAuthor.id } },
        },
      })

      // Check if the old author has no more books and delete if appropriate
      const otherBooksWithOldAuthor = await prisma.book.count({
        where: {
          authorId: book.author.id,
          id: { not: bookId },
        },
      })

      if (otherBooksWithOldAuthor === 0 && book.author.name === 'Unknown') {
        // Delete the old author if it's "Unknown" and not used by other books
        await prisma.author.delete({
          where: { id: book.author.id },
        })
      }
    } else {
      // If this is the only book by this author, simply update the author's name
      const booksWithSameAuthor = await prisma.book.count({
        where: { authorId: book.author.id },
      })

      if (booksWithSameAuthor === 1) {
        // Only this book uses the author, so update the author name
        await prisma.author.update({
          where: { id: book.author.id },
          data: { name: authorName.trim() },
        })
      } else {
        // Create a new author and connect the book to it
        await prisma.book.update({
          where: { id: bookId },
          data: {
            author: {
              create: { name: authorName.trim() },
            },
          },
        })

        // Check if the old author has no more books and delete if appropriate
        const otherBooksWithOldAuthor = await prisma.book.count({
          where: {
            authorId: book.author.id,
            id: { not: bookId },
          },
        })

        if (otherBooksWithOldAuthor === 0 && book.author.name === 'Unknown') {
          // Delete the old author if it's "Unknown" and not used by other books
          await prisma.author.delete({
            where: { id: book.author.id },
          })
        }
      }
    }

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Error updating author:', error)
    return res.status(500).json({ error: 'Failed to update author' })
  }
}

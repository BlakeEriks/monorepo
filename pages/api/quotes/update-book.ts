import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { bookId, bookTitle, authorName } = req.body

    if (!bookId || typeof bookId !== 'number') {
      return res.status(400).json({ error: 'Valid book ID is required' })
    }

    if (!bookTitle || typeof bookTitle !== 'string' || !bookTitle.trim()) {
      return res.status(400).json({ error: 'Valid book title is required' })
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

    // Determine if we need to update the title
    const titleNeedsUpdate = book.title !== bookTitle.trim()

    // Determine if we need to update the author
    const authorNeedsUpdate = book.author.name !== authorName.trim()

    // If neither needs updating, return early
    if (!titleNeedsUpdate && !authorNeedsUpdate) {
      return res.status(200).json({ message: 'No changes needed' })
    }

    // Handle author update logic
    if (authorNeedsUpdate) {
      // Check if another author with this name already exists
      const existingAuthor = await prisma.author.findUnique({
        where: { name: authorName.trim() },
      })

      if (existingAuthor) {
        // If author exists, update the book to use the existing author
        await prisma.book.update({
          where: { id: bookId },
          data: {
            title: titleNeedsUpdate ? bookTitle.trim() : undefined,
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
          // Only this book uses the author, so update the author name and book title
          await prisma.$transaction([
            prisma.author.update({
              where: { id: book.author.id },
              data: { name: authorName.trim() },
            }),
            titleNeedsUpdate
              ? prisma.book.update({
                  where: { id: bookId },
                  data: { title: bookTitle.trim() },
                })
              : prisma.$queryRaw`SELECT 1`, // No-op if title doesn't need update
          ])
        } else {
          // Create a new author and connect the book to it
          await prisma.book.update({
            where: { id: bookId },
            data: {
              title: titleNeedsUpdate ? bookTitle.trim() : undefined,
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
    } else if (titleNeedsUpdate) {
      // Only update the title if only the title needs updating
      await prisma.book.update({
        where: { id: bookId },
        data: { title: bookTitle.trim() },
      })
    }

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Error updating book:', error)
    return res.status(500).json({ error: 'Failed to update book' })
  }
}

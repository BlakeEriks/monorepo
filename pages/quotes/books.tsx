import { GetServerSideProps } from 'next'
import { useState } from 'react'
import prisma from '../../lib/prisma'
import QuotesLayout from './layout'

type Book = {
  id: number
  title: string
  source: string | null
  author: {
    id: number
    name: string
  }
  quotes: {
    id: number
    content: string
    createdAt: string
    userId: number
    user: {
      name: string
    }
  }[]
}

type BookListProps = {
  books: Book[]
}

export default function Books({ books }: BookListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [bookTitle, setBookTitle] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateMessage, setUpdateMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const filteredBooks = books.filter(
    (book) =>
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const openEditModal = (book: Book) => {
    setEditingBook(book)
    setBookTitle(book.title)
    setAuthorName(book.author.name)
    setUpdateMessage(null)
  }

  const closeEditModal = () => {
    setEditingBook(null)
    setBookTitle('')
    setAuthorName('')
    setUpdateMessage(null)
  }

  const handleBookUpdate = async () => {
    if (!editingBook || !authorName.trim() || !bookTitle.trim()) return

    setIsUpdating(true)
    try {
      const response = await fetch('/api/quotes/update-book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookId: editingBook.id,
          bookTitle: bookTitle.trim(),
          authorName: authorName.trim(),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setUpdateMessage({ type: 'success', text: 'Book updated successfully!' })
        // Update the local state to reflect the change
        books = books.map((book) => {
          if (book.id === editingBook.id) {
            return {
              ...book,
              title: bookTitle.trim(),
              author: {
                ...book.author,
                name: authorName.trim(),
              },
            }
          }
          return book
        })

        // Wait a moment before closing to show the success message
        setTimeout(() => {
          window.location.reload() // Reload to get fresh data
        }, 1500)
      } else {
        setUpdateMessage({ type: 'error', text: data.error || 'Failed to update book' })
      }
    } catch (error) {
      setUpdateMessage({ type: 'error', text: 'An error occurred while updating the book' })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <QuotesLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search Books or Authors
              </label>
              <input
                type="text"
                id="search"
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">{filteredBooks.length} Books</h2>
          </div>

          {filteredBooks.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No books found. Try adjusting your search or upload some Kindle clippings.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredBooks.map((book) => (
                <div key={book.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold mb-2">{book.title}</h3>
                      <h4 className="text-md text-gray-600 mb-4">
                        by {book.author.name}
                        {book.author.name === 'Unknown' && (
                          <span className="text-red-500 ml-2 text-sm">(Author unknown)</span>
                        )}
                      </h4>
                    </div>
                    <button
                      onClick={() => openEditModal(book)}
                      className="text-blue-600 hover:text-blue-800 text-sm border border-blue-300 rounded px-2 py-1"
                    >
                      Edit Book
                    </button>
                  </div>

                  <div className="text-sm text-gray-500 mb-4">
                    {book.quotes.length} {book.quotes.length === 1 ? 'quote' : 'quotes'}
                  </div>

                  <div className="space-y-4">
                    {book.quotes.slice(0, 3).map((quote) => (
                      <div key={quote.id} className="pl-4 border-l-2 border-gray-200">
                        <p className="italic text-gray-800">
                          &ldquo;
                          {quote.content.length > 200
                            ? quote.content.substring(0, 200) + '...'
                            : quote.content}
                          &rdquo;
                        </p>
                        <div className="mt-1 text-xs text-gray-500">
                          Added by {quote.user.name} ·{' '}
                          {new Date(quote.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}

                    {book.quotes.length > 3 && (
                      <div className="text-sm">
                        <p className="text-blue-600">+ {book.quotes.length - 3} more quotes</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Book Modal */}
      {editingBook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Edit Book Details</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="bookTitle" className="block text-sm font-medium text-gray-700 mb-1">
                  Book Title
                </label>
                <input
                  type="text"
                  id="bookTitle"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  placeholder="Enter book title"
                />
              </div>

              <div>
                <label
                  htmlFor="authorName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Author Name
                </label>
                <input
                  type="text"
                  id="authorName"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Enter author name"
                />
              </div>
            </div>

            {updateMessage && (
              <div
                className={`mt-4 mb-4 p-2 rounded ${
                  updateMessage.type === 'success'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {updateMessage.text}
              </div>
            )}

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={closeEditModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button
                onClick={handleBookUpdate}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                disabled={isUpdating || !authorName.trim() || !bookTitle.trim()}
              >
                {isUpdating ? 'Updating...' : 'Update Book'}
              </button>
            </div>
          </div>
        </div>
      )}
    </QuotesLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async () => {
  const books = await prisma.book.findMany({
    orderBy: {
      title: 'asc',
    },
    include: {
      author: true,
      quotes: {
        where: {
          deleted: false,
        },
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  })

  return {
    props: {
      books: JSON.parse(JSON.stringify(books)),
    },
  }
}

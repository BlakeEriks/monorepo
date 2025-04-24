import { GetServerSideProps } from 'next'
import { useState } from 'react'
import prisma from '../../lib/prisma'
import QuotesLayout from './layout'

type Author = {
  id: number
  name: string
  books: {
    id: number
    title: string
    quotes: {
      id: number
      content: string
      createdAt: string
      userId: number
      user: {
        name: string
      }
    }[]
  }[]
}

type AuthorListProps = {
  authors: Author[]
}

export default function Authors({ authors }: AuthorListProps) {
  const [searchTerm, setSearchTerm] = useState('')

  // Calculate total quotes per author
  const authorsWithQuoteCounts = authors
    .map((author) => {
      const totalQuotes = author.books.reduce((total, book) => total + book.quotes.length, 0)
      return {
        ...author,
        totalQuotes,
      }
    })
    .sort((a, b) => b.totalQuotes - a.totalQuotes) // Sort by most quotes

  const filteredAuthors = authorsWithQuoteCounts.filter((author) =>
    author.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <QuotesLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search Authors
              </label>
              <input
                type="text"
                id="search"
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Search authors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">{filteredAuthors.length} Authors</h2>
          </div>

          {filteredAuthors.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No authors found. Try adjusting your search or upload some Kindle clippings.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredAuthors.map((author) => (
                <div key={author.id} className="p-6">
                  <h3 className="text-xl font-bold mb-2">{author.name}</h3>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <div className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {author.totalQuotes} {author.totalQuotes === 1 ? 'quote' : 'quotes'}
                    </div>
                    <div className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                      {author.books.length} {author.books.length === 1 ? 'book' : 'books'}
                    </div>
                  </div>

                  <div className="mt-4">
                    <h4 className="text-md font-semibold mb-2">Books:</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      {author.books.map((book) => (
                        <li key={book.id}>
                          {book.title}{' '}
                          <span className="text-gray-500">
                            ({book.quotes.length} {book.quotes.length === 1 ? 'quote' : 'quotes'})
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {author.totalQuotes > 0 && (
                    <div className="mt-4">
                      <h4 className="text-md font-semibold mb-2">Sample Quote:</h4>
                      <div className="pl-4 border-l-2 border-gray-200">
                        <p className="italic text-gray-800">
                          &ldquo;
                          {author.books[0].quotes[0].content.length > 200
                            ? author.books[0].quotes[0].content.substring(0, 200) + '...'
                            : author.books[0].quotes[0].content}
                          &rdquo;
                        </p>
                        <div className="mt-1 text-xs text-gray-500">
                          From {author.books[0].title}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </QuotesLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async () => {
  const authors = await prisma.author.findMany({
    orderBy: {
      name: 'asc',
    },
    include: {
      books: {
        include: {
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
      },
    },
  })

  return {
    props: {
      authors: JSON.parse(JSON.stringify(authors)),
    },
  }
}

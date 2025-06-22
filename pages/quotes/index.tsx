import { GetServerSideProps } from 'next'
import React, { useState } from 'react'
import prisma from '../../lib/prisma'
import QuotesLayout from './layout'

type Quote = {
  id: number
  createdAt: string
  content: string
  quotee: string | null
  bookId: number | null
  userId: number
  book: {
    id: number
    title: string
    author: {
      id: number
      name: string
    }
  } | null
  user: {
    id: number
    name: string
  }
}

type QuotesIndexProps = {
  quotes: Quote[]
  users: { id: number; name: string }[]
}

export default function QuotesIndex({ quotes: initialQuotes, users }: QuotesIndexProps) {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Filter quotes based on user selection and search term
  const filteredQuotes = initialQuotes.filter((quote) => {
    const matchesUser = selectedUserId ? quote.userId === selectedUserId : true
    const matchesSearch = searchTerm
      ? quote.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (quote.book?.title.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        (quote.book?.author.name.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
      : true

    return matchesUser && matchesSearch
  })

  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setSelectedUserId(value ? parseInt(value) : null)
  }

  return (
    <QuotesLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/3">
              <label htmlFor="user-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Filter by User
              </label>
              <select
                id="user-filter"
                className="w-full p-2 border border-gray-300 rounded-md"
                onChange={handleUserChange}
                value={selectedUserId || ''}
              >
                <option value="">All Users</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full md:w-2/3">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search Quotes, Books or Authors
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
            <h2 className="text-lg font-semibold text-gray-600">{filteredQuotes.length} Quotes</h2>
          </div>

          {filteredQuotes.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No quotes found. Try adjusting your filters or upload some Kindle clippings.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredQuotes.map((quote) => (
                <div key={quote.id} className="p-6">
                  <blockquote className="text-lg italic mb-2 text-gray-600">
                    &ldquo;{quote.content}&rdquo;
                  </blockquote>

                  <div className="text-sm text-gray-600 mb-1">
                    {quote.book ? (
                      <>
                        <span className="font-semibold">{quote.book.title}</span>
                        {quote.book.author && <span> — {quote.book.author.name}</span>}
                      </>
                    ) : (
                      quote.quotee && <span>{quote.quotee}</span>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
                    <span>Added by {quote.user.name}</span>
                    <span>
                      {new Date(quote.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
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
  const [quotes, users] = await Promise.all([
    prisma.quote.findMany({
      where: {
        deleted: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        book: {
          include: {
            author: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    }),
  ])

  return {
    props: {
      quotes: JSON.parse(JSON.stringify(quotes)), // Serialize the Prisma Date objects
      users: users,
    },
  }
}

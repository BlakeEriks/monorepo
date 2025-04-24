import { User } from '@prisma/client'
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import React, { useState } from 'react'
import prisma from '../../lib/prisma'
import QuotesLayout from './layout'

type KindleUploadProps = {
  users: User[]
}

export default function KindleUpload({ users }: KindleUploadProps) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [userId, setUserId] = useState<number | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; count?: number; error?: string } | null>(
    null
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }

  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setUserId(parseInt(e.target.value))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file || !userId) {
      setResult({ success: false, error: 'Please select a file and user' })
      return
    }

    setIsUploading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('userId', userId.toString())

      const response = await fetch('/api/upload-kindle-clippings', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setResult({ success: true, count: data.count })
      } else {
        setResult({ success: false, error: data.error || 'Failed to upload file' })
      }
    } catch (error) {
      setResult({ success: false, error: 'An error occurred while uploading the file' })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <QuotesLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Upload Kindle Clippings</h2>
          <p className="text-gray-600 mb-6">
            Upload your clippings.txt file from your Kindle device to import your highlights into
            the quotes library.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="user" className="block text-sm font-medium text-gray-700 mb-1">
                Select User
              </label>
              <select
                id="user"
                className="w-full p-2 border border-gray-300 rounded-md"
                onChange={handleUserChange}
                value={userId || ''}
                required
              >
                <option value="">-- Select User --</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-1">
                Select Clippings.txt File
              </label>
              <input
                type="file"
                id="file"
                accept=".txt"
                className="w-full p-2 border border-gray-300 rounded-md"
                onChange={handleFileChange}
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                To get this file, connect your Kindle to your computer and look for the file called
                &quot;clippings.txt&quot; in the Documents folder.
              </p>
            </div>

            <button
              type="submit"
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
              disabled={isUploading || !file || !userId}
            >
              {isUploading ? 'Uploading...' : 'Upload Clippings'}
            </button>
          </form>

          {result && (
            <div
              className={`mt-6 p-3 rounded-md ${result.success ? 'bg-green-100' : 'bg-red-100'}`}
            >
              {result.success ? (
                <p className="text-green-700">
                  Successfully imported {result.count} new quotes.{' '}
                  <button onClick={() => router.push('/quotes')} className="underline font-medium">
                    View all quotes
                  </button>
                </p>
              ) : (
                <p className="text-red-700">{result.error}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </QuotesLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async () => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: 'asc',
    },
  })

  return {
    props: {
      users: JSON.parse(JSON.stringify(users)), // Serialize the Prisma objects
    },
  }
}

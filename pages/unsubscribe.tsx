import localFont from 'next/font/local'
import Link from 'next/link'
import { useState } from 'react'

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
})
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
})

export default function Unsubscribe() {
  const [email, setEmail] = useState('')
  const [unsubscribing, setUnsubscribing] = useState(false)
  const [unsubscribeStatus, setUnsubscribeStatus] = useState<{
    success: boolean
    message: string
  } | null>(null)

  const handleUnsubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      setUnsubscribeStatus({
        success: false,
        message: 'Please enter a valid email address.',
      })
      return
    }

    try {
      setUnsubscribing(true)
      setUnsubscribeStatus(null)

      const response = await fetch('/api/newsletter/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      setUnsubscribeStatus({
        success: data.success,
        message:
          data.message ||
          (data.success
            ? 'Successfully unsubscribed from the newsletter.'
            : 'Failed to unsubscribe from the newsletter.'),
      })

      if (data.success) {
        setEmail('')
      }
    } catch (error) {
      setUnsubscribeStatus({
        success: false,
        message: 'An error occurred while trying to unsubscribe.',
      })
    } finally {
      setUnsubscribing(false)
    }
  }

  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable} grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]`}
    >
      <main className='flex flex-col gap-8 row-start-2 items-center max-w-lg w-full'>
        <h1 className='text-3xl font-bold mb-6'>Unsubscribe from Newsletter</h1>

        <div className='w-full bg-gray-50 p-6 rounded-lg border border-gray-200'>
          <p className='mb-6'>
            We're sorry to see you go. Please enter your email address below to unsubscribe from our
            newsletter.
          </p>

          <form onSubmit={handleUnsubscribe} className='space-y-4'>
            <div>
              <label htmlFor='email' className='block text-sm font-medium text-gray-700 mb-1'>
                Email Address
              </label>
              <input
                type='email'
                id='email'
                value={email}
                onChange={e => setEmail(e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                placeholder='you@example.com'
                required
              />
            </div>

            {unsubscribeStatus && (
              <div
                className={`p-3 rounded mb-4 ${
                  unsubscribeStatus.success
                    ? 'bg-green-100 text-green-700 border border-green-400'
                    : 'bg-red-100 text-red-700 border border-red-400'
                }`}
              >
                {unsubscribeStatus.message}
              </div>
            )}

            <button
              type='submit'
              disabled={unsubscribing}
              className='w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {unsubscribing ? 'Processing...' : 'Unsubscribe'}
            </button>
          </form>

          {unsubscribeStatus?.success && (
            <div className='mt-6 text-center'>
              <p className='mb-4'>You have been successfully unsubscribed.</p>
              <Link href='/' className='text-blue-500 hover:text-blue-700 underline'>
                Return to homepage
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

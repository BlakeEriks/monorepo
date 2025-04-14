import localFont from 'next/font/local'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

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

// Define topic interface with vote count
interface TopicWithVotes {
  id: number
  title: string
  description: string | null
  status: string
  electionsParticipated: number
  createdAt: string
  voteCount: number
}

// Define election interface
interface Election {
  id: number
  startedAt: string
  topics: TopicWithVotes[]
}

export default function Home() {
  const router = useRouter()
  const [voteRecorded, setVoteRecorded] = useState(false)
  const [sendingNewsletter, setSendingNewsletter] = useState(false)
  const [newsletterStatus, setNewsletterStatus] = useState<{
    success: boolean
    message: string
  } | null>(null)
  const [currentElection, setCurrentElection] = useState<Election | null>(null)
  const [loading, setLoading] = useState(true)
  const [showTopicForm, setShowTopicForm] = useState(false)
  const [newTopic, setNewTopic] = useState({ title: '', description: '' })
  const [creatingTopic, setCreatingTopic] = useState(false)
  const [topicFormStatus, setTopicFormStatus] = useState<{
    success: boolean
    message: string
  } | null>(null)
  const [subscriberEmail, setSubscriberEmail] = useState('')
  const [subscriberName, setSubscriberName] = useState('')
  const [subscribing, setSubscribing] = useState(false)
  const [subscribeStatus, setSubscribeStatus] = useState<{
    success: boolean
    message: string
  } | null>(null)

  // Fetch election on component mount
  useEffect(() => {
    fetchCurrentElection()
  }, [])

  const fetchCurrentElection = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/newsletter/election')
      const data = await response.json()

      if (data.success && data.election) {
        setCurrentElection(data.election)
      }
    } catch (error) {
      console.error('Error fetching current election:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle the vote parameter from URL
  useEffect(() => {
    if (!router.isReady) return

    const { vote, subscriberId, token, electionId } = router.query
    if (vote && !voteRecorded) {
      // If subscriber details are present in URL, capture them for voting
      if (subscriberId && token && typeof subscriberId === 'string' && typeof token === 'string') {
        // Handle vote with subscriber information
        handleVoteWithSubscriber(vote as string, subscriberId, token, electionId as string)
      } else {
        // Show message that subscriber info is missing
        setVoteRecorded(true) // Prevent multiple attempts
        console.error('Missing subscriber information')
      }
    }
  }, [router.isReady, router.query, voteRecorded])

  const handleVoteWithSubscriber = async (
    topicId: string,
    subscriberId: string,
    token: string,
    electionId?: string
  ) => {
    try {
      const response = await fetch('/api/newsletter/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topicId,
          subscriberId,
          token,
          electionId,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setVoteRecorded(true)
        // Refresh topics to see updated vote count
        fetchCurrentElection()

        // Clear the vote from URL to prevent double-counting on refresh
        router.replace('/', undefined, { shallow: true })
      } else {
        console.error('Vote failed:', data.message)

        // If already voted, still mark as recorded to prevent multiple attempts
        if (data.alreadyVoted) {
          setVoteRecorded(true)
        }
      }
    } catch (error) {
      console.error('Error recording vote:', error)
    }
  }

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subscriberEmail || !subscriberEmail.includes('@')) {
      setSubscribeStatus({
        success: false,
        message: 'Please enter a valid email address.',
      })
      return
    }

    try {
      setSubscribing(true)
      setSubscribeStatus(null)

      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: subscriberEmail,
          name: subscriberName || undefined,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSubscribeStatus({
          success: true,
          message: data.message || 'Subscribed successfully!',
        })
        // Reset form if it was a new subscription
        if (!data.isExisting) {
          setSubscriberEmail('')
          setSubscriberName('')
        }
      } else {
        setSubscribeStatus({
          success: false,
          message: data.message || 'Failed to subscribe',
        })
      }
    } catch (error) {
      setSubscribeStatus({
        success: false,
        message: 'An error occurred while subscribing',
      })
    } finally {
      setSubscribing(false)
    }
  }

  const sendTestNewsletter = async () => {
    try {
      setSendingNewsletter(true)
      setNewsletterStatus(null)

      const response = await fetch('/api/ai-newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      setNewsletterStatus(data)
    } catch (error) {
      setNewsletterStatus({
        success: false,
        message: 'Error sending newsletter. Please try again.',
      })
    } finally {
      setSendingNewsletter(false)
    }
  }

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTopic.title.trim()) {
      setTopicFormStatus({
        success: false,
        message: 'Please enter a topic title.',
      })
      return
    }

    try {
      setCreatingTopic(true)
      setTopicFormStatus(null)

      const response = await fetch('/api/newsletter/topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTopic.title,
          description: newTopic.description || undefined,
          status: 'VOTING', // Set new topics directly to voting status for this demo
        }),
      })

      const data = await response.json()

      if (data.success) {
        setTopicFormStatus({
          success: true,
          message: 'Topic created successfully!',
        })
        // Reset form
        setNewTopic({ title: '', description: '' })
        // Refresh topics list
        fetchCurrentElection()
        // Hide form after successful creation
        setTimeout(() => {
          setShowTopicForm(false)
          setTopicFormStatus(null)
        }, 2000)
      } else {
        setTopicFormStatus({
          success: false,
          message: data.message || 'Failed to create topic',
        })
      }
    } catch (error) {
      setTopicFormStatus({
        success: false,
        message: 'An error occurred while creating the topic',
      })
    } finally {
      setCreatingTopic(false)
    }
  }

  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable} grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]`}
    >
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start max-w-lg w-full">
        <div className="flex justify-between items-center w-full">
          <h1 className="text-3xl font-bold">Newsletter Topics</h1>
          <button
            onClick={() => setShowTopicForm(!showTopicForm)}
            className="bg-blue-500 hover:bg-blue-700 text-white text-sm py-1 px-3 rounded"
          >
            {showTopicForm ? 'Cancel' : 'Suggest Topic'}
          </button>
        </div>

        {/* Newsletter Subscription Form */}
        <div className="w-full bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h2 className="text-xl font-semibold mb-4">Subscribe to Our Newsletter</h2>
          <form onSubmit={handleSubscribe}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                id="email"
                value={subscriberEmail}
                onChange={(e) => setSubscriberEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name (optional)
              </label>
              <input
                type="text"
                id="name"
                value={subscriberName}
                onChange={(e) => setSubscriberName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Your name"
              />
            </div>

            {subscribeStatus && (
              <div
                className={`p-3 rounded mb-4 ${
                  subscribeStatus.success
                    ? 'bg-green-100 text-green-700 border border-green-400'
                    : 'bg-red-100 text-red-700 border border-red-400'
                }`}
              >
                {subscribeStatus.message}
              </div>
            )}

            <button
              type="submit"
              disabled={subscribing}
              className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {subscribing ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>
        </div>

        {showTopicForm && (
          <div className="w-full bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Suggest a New Topic</h2>
            <form onSubmit={handleCreateTopic}>
              <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={newTopic.title}
                  onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter topic title"
                  required
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Description (optional)
                </label>
                <textarea
                  id="description"
                  value={newTopic.description}
                  onChange={(e) => setNewTopic({ ...newTopic, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter topic description"
                  rows={3}
                />
              </div>

              {topicFormStatus && (
                <div
                  className={`p-3 rounded mb-4 ${
                    topicFormStatus.success
                      ? 'bg-green-100 text-green-700 border border-green-400'
                      : 'bg-red-100 text-red-700 border border-red-400'
                  }`}
                >
                  {topicFormStatus.message}
                </div>
              )}

              <button
                type="submit"
                disabled={creatingTopic}
                className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingTopic ? 'Creating...' : 'Create Topic'}
              </button>
            </form>
          </div>
        )}

        {voteRecorded && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            Thank you for voting!
          </div>
        )}

        {newsletterStatus && (
          <div
            className={`px-4 py-3 rounded mb-4 ${newsletterStatus.success ? 'bg-green-100 border border-green-400 text-green-700' : 'bg-red-100 border border-red-400 text-red-700'}`}
          >
            {newsletterStatus.message}
          </div>
        )}

        <div className="w-full">
          <h2 className="text-xl font-semibold mb-4">Current Election Topics</h2>
          {loading ? (
            <p>Loading election data...</p>
          ) : currentElection ? (
            <>
              <p className="mb-4 text-sm text-gray-600">
                Election started: {new Date(currentElection.startedAt).toLocaleString()}
              </p>
              {currentElection.topics.length > 0 ? (
                currentElection.topics.map((topic, i) => (
                  <div key={topic.id} className="flex items-center mb-4 border-b pb-2">
                    <div className="font-semibold mr-2">{i + 1}.</div>
                    <div className="flex-grow">
                      {topic.title}
                      {topic.description && (
                        <p className="text-sm text-gray-600">{topic.description}</p>
                      )}
                    </div>
                    <div className="font-mono bg-gray-100 px-2 py-1 rounded text-black">
                      {topic.voteCount} {topic.voteCount === 1 ? 'vote' : 'votes'}
                    </div>
                  </div>
                ))
              ) : (
                <p>No topics available in this election.</p>
              )}
            </>
          ) : (
            <p>No active election found.</p>
          )}
        </div>

        <button
          onClick={sendTestNewsletter}
          disabled={sendingNewsletter}
          className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sendingNewsletter ? 'Sending...' : 'Send Test Newsletter'}
        </button>
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center"></footer>
    </div>
  )
}

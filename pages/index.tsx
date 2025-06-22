import Flex from '@/ui/Flex'
import { motion } from 'framer-motion'
import localFont from 'next/font/local'
import Image from 'next/image'
import Link from 'next/link'
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

interface StatusMessageProps {
  success: boolean
  message: string
}

// Navigation component for the top of the page
const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm shadow-sm py-3 px-6">
      <div className="mx-auto flex justify-between items-center">
        <Link href="/">
          <Image src="/title-one-line.png" alt="Learn Something New" width={400} height={400} />
        </Link>

        <div className="hidden md:flex space-x-8">
          <a
            href="#how-it-works"
            className="text-[#09202F]/70 hover:text-[#ff5533] transition-colors"
          >
            How It Works
          </a>
          <a
            href="#next-topic"
            className="text-[#09202F]/70 hover:text-[#ff5533] transition-colors"
          >
            Next Topic
          </a>
          <a href="#subscribe" className="text-[#09202F]/70 hover:text-[#ff5533] transition-colors">
            Subscribe
          </a>
        </div>
      </div>
    </nav>
  )
}

const NewsletterSubscriptionForm = () => {
  const [subscriberEmail, setSubscriberEmail] = useState('')
  const [subscribing, setSubscribing] = useState(false)
  const [subscribeStatus, setSubscribeStatus] = useState<{
    success: boolean
    message: string
  } | null>(null)

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
        body: JSON.stringify({ email: subscriberEmail }),
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

  return (
    <div id="subscribe" className="w-full max-w-xl mx-auto relative px-6 py-12">
      <h2 className="text-2xl font-bold mb-8 text-center text-[#09202F]">
        Subscribe to Learn Something New
      </h2>

      {/* Curved Arrow 1 */}
      <motion.div
        className="absolute -top-2 -left-8 transform rotate-45 hidden md:block"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        <svg
          width="120"
          height="80"
          viewBox="0 0 120 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10 70C10 30 40 10 100 10"
            stroke="#09202F"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M85 10L100 10L100 25"
            stroke="#09202F"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>

      {/* Curved Arrow 2 */}
      <motion.div
        className="absolute -bottom-2 -right-8 transform -rotate-45 hidden md:block"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.8 }}
      >
        <svg
          width="120"
          height="80"
          viewBox="0 0 120 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M110 10C110 50 80 70 20 70"
            stroke="#09202F"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M35 70L20 70L20 55"
            stroke="#09202F"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>

      <form onSubmit={handleSubscribe} className="relative z-10">
        <div className="mb-4 relative">
          <div className="relative rounded-full shadow-lg overflow-hidden">
            <input
              type="email"
              id="email"
              value={subscriberEmail}
              onChange={(e) => setSubscriberEmail(e.target.value)}
              className="w-full px-6 py-4 pr-16 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#FE4E29] focus:border-transparent text-lg"
              placeholder="you@example.com"
              required
            />
            <button
              type="submit"
              disabled={subscribing}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-[#FE4E29] to-[#FF9D45] text-white rounded-full w-12 h-12 flex items-center justify-center transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {subscribing ? (
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {subscribeStatus && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <StatusMessage success={subscribeStatus.success} message={subscribeStatus.message} />
          </motion.div>
        )}
      </form>
    </div>
  )
}

const TopicSuggestionForm = () => {
  const [newTopic, setNewTopic] = useState({ title: '', description: '' })
  const [creatingTopic, setCreatingTopic] = useState(false)
  const [topicFormStatus, setTopicFormStatus] = useState<{
    success: boolean
    message: string
  } | null>(null)

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
        // Hide form after successful creation
        setTimeout(() => {
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
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
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
          <StatusMessage success={topicFormStatus.success} message={topicFormStatus.message} />
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
  )
}

const StatusMessage = ({ success, message }: StatusMessageProps) => {
  return (
    <div
      className={`p-3 rounded mb-4 ${
        success
          ? 'bg-green-100 text-green-700 border border-green-400'
          : 'bg-red-100 text-red-700 border border-red-400'
      }`}
    >
      {message}
    </div>
  )
}

const ElectionResults = () => {
  const [loading, setLoading] = useState(true)
  const [currentElection, setCurrentElection] = useState<Election | null>(null)

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

  return (
    <div id="next-topic" className="w-full max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-[#09202F] mb-6 flex items-center text-center justify-center">
        ✍️ Next Newsletter Topic
      </h2>
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff5533]"></div>
            </div>
          ) : currentElection ? (
            <>
              {currentElection.topics.length > 0 ? (
                <div className="space-y-6">
                  {currentElection.topics.map((topic, i) => {
                    // Find max vote count
                    const maxVotes = Math.max(...currentElection.topics.map((t) => t.voteCount))

                    // Calculate width percentage with better proportions
                    // Min width of 10% for zero votes, max width of 90%
                    const widthPercentage =
                      maxVotes === 0
                        ? 10 // If all are zero, give minimum width
                        : topic.voteCount === 0
                          ? 10 // Min width for zero votes
                          : 10 + Math.round((topic.voteCount / maxVotes) * 80) // Scale between 10% and 90%

                    return (
                      <div
                        key={topic.id}
                        className="transform transition duration-200 hover:scale-[1.01]"
                      >
                        <div className="flex items-center mb-1">
                          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                            {i + 1}
                          </div>
                          <div className="flex-grow">
                            <h3 className="font-bold text-[#09202F]">{topic.title}</h3>
                          </div>
                          <div className="flex-shrink-0 bg-gray-100 px-3 py-1 rounded-full text-[#09202F] font-semibold text-sm ml-2">
                            {topic.voteCount} {topic.voteCount === 1 ? 'vote' : 'votes'}
                          </div>
                        </div>

                        {topic.description && (
                          <p className="text-sm text-[#09202F]/70 ml-11 mb-2">
                            {topic.description}
                          </p>
                        )}

                        <div className="h-8 bg-gray-200 rounded-full overflow-hidden ml-11 relative">
                          <motion.div
                            className="h-full bg-gradient-to-r from-[#FE4E29] to-[#FF9D45] absolute left-0 top-0 rounded-full"
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: `${widthPercentage}%`, opacity: 1 }}
                            transition={{
                              duration: 0.8,
                              delay: i * 0.2,
                              ease: 'easeOut',
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}

                  <div className="mt-8 text-center">
                    <p className="text-sm text-[#09202F]/60 italic">
                      The winning topic will be featured in our next newsletter. Subscribe to vote
                      on future topics!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10">
                  <svg
                    className="w-16 h-16 mx-auto text-gray-300 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="text-[#09202F]/60">No topics available in this election.</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-10">
              <svg
                className="w-16 h-16 mx-auto text-gray-300 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-[#09202F]/60">No active election found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Title component that matches the styling from the image
const NewsletterTitle = () => {
  return (
    <Flex justify="center" align="center" className="flex-col text-center mb-8 mx-auto h-[400px]">
      <Image src="/title.png" alt="Learn Something New" width={800} height={800} />
      {/* <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#0f1a2b]">
        Learn Something
        <div className="flex items-center justify-center">
          <span>New</span>
          <span className="text-[#ff5533] font-cursive italic" style={{ fontFamily: 'cursive' }}>
            sletter
          </span>
        </div>
      </h1> */}
      <p className="mt-4 text-2xl text-[#09202F]/80 max-w-xl mx-auto">
        A dose of curiosity, delivered fresh every other day.
      </p>
    </Flex>
  )
}

// Component that explains how the newsletter works
const HowItWorks = () => {
  return (
    <div id="how-it-works" className="w-full rounded-lg p-6 mb-8">
      <h2 className="text-2xl font-bold text-center mb-6 text-[#09202F]">How It Works</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-lg shadow-sm flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
              />
            </svg>
          </div>
          <h3 className="font-bold mb-2 text-[#09202F]">You Choose</h3>
          <p className="text-[#09202F]/70">
            Learn Something Newsletter is powered by your curiosity - readers vote on what they want
            to learn about next.
          </p>
        </div>

        <div className="bg-white p-5 rounded-lg shadow-sm flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </div>
          <h3 className="font-bold mb-2 text-[#09202F]">We Deliver</h3>
          <p className="text-[#09202F]/70">
            Each week, we research and write an in-depth exploration of the winning topic, delivered
            straight to your inbox.
          </p>
        </div>

        <div className="bg-white p-5 rounded-lg shadow-sm flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="font-bold mb-2 text-[#09202F]">Vote Again</h3>
          <p className="text-[#09202F]/70">
            At the end of each newsletter, you&apos;ll find a voting section for the next topic.
            Suggest your own ideas or vote on others!
          </p>
        </div>
      </div>
    </div>
  )
}

// Define newsletter interface
interface Newsletter {
  id: string
  title: string
  date: string
  excerpt: string
  imageUrl: string
  slug: string
}

// Recent newsletters component
const RecentNewsletters = () => {
  // Dummy data for recent newsletters
  const recentNewsletters: Newsletter[] = [
    {
      id: '1',
      title: 'The Fascinating World of Quantum Computing',
      date: 'June 15, 2023',
      excerpt:
        'Dive into the bizarre realm of quantum mechanics and discover how quantum computers are set to revolutionize technology as we know it.',
      imageUrl:
        'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      slug: 'quantum-computing',
    },
    {
      id: '2',
      title: "Deep Dive: The Ocean's Mysterious Twilight Zone",
      date: 'May 28, 2023',
      excerpt:
        'Explore the mesopelagic zone, a shadowy layer of the ocean between 200 and 1,000 meters deep where strange creatures thrive in near darkness.',
      imageUrl:
        'https://images.unsplash.com/photo-1551244072-5d12893278ab?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80',
      slug: 'ocean-twilight-zone',
    },
    {
      id: '3',
      title: 'The Psychology of Time Perception',
      date: 'May 10, 2023',
      excerpt:
        "Why does time fly when you're having fun but drag when you're bored? The science behind how our brains perceive time passing.",
      imageUrl:
        'https://images.unsplash.com/photo-1501139083538-0139583c060f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      slug: 'time-perception',
    },
  ]

  return (
    <div className="w-full max-w-5xl mx-auto my-16">
      <h2 className="text-2xl font-bold text-[#09202F] mb-8 text-center">Recent Newsletters</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {recentNewsletters.map((newsletter) => (
          <motion.div
            key={newsletter.id}
            className="bg-white rounded-xl shadow-md overflow-hidden h-full flex flex-col"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: parseInt(newsletter.id) * 0.15 }}
          >
            <div className="relative h-48 overflow-hidden">
              <Image
                src={newsletter.imageUrl}
                alt={newsletter.title}
                fill={true}
                className="object-cover transition-transform duration-500 hover:scale-110"
              />
            </div>
            <div className="p-6 flex-grow flex flex-col">
              <div className="text-sm text-[#09202F]/60 mb-2">{newsletter.date}</div>
              <h3 className="text-xl font-bold text-[#09202F] mb-3">{newsletter.title}</h3>
              <p className="text-[#09202F]/80 mb-4 flex-grow">{newsletter.excerpt}</p>
              <Link
                href={`/newsletter/${newsletter.slug}`}
                className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center"
              >
                Read more
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 ml-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </Link>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="text-center mt-10">
        <Link
          href="/newsletters"
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#FE4E29] hover:bg-[#e64525] md:py-4 md:text-lg md:px-8 transition-colors duration-300"
        >
          View All Newsletters
        </Link>
      </div>
    </div>
  )
}

export default function Home() {
  const router = useRouter()
  const [voteRecorded, setVoteRecorded] = useState(false)
  const [sendingNewsletter, setSendingNewsletter] = useState(false)
  const [newsletterStatus, setNewsletterStatus] = useState<{
    success: boolean
    message: string
  } | null>(null)
  const [showTopicForm, setShowTopicForm] = useState(false)

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

  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable} grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)] bg-[#FEFAF2] text-[#09202F]`}
    >
      <Navbar />

      <main className="flex justify-center items-center flex-col gap-16 row-start-2 sm:items-start w-full mx-[10%] pt-16">
        <NewsletterTitle />

        <NewsletterSubscriptionForm />

        <HowItWorks />

        <RecentNewsletters />

        <ElectionResults />

        {showTopicForm && <TopicSuggestionForm />}

        {voteRecorded && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            Thank you for voting!
          </div>
        )}

        {newsletterStatus && (
          <StatusMessage success={newsletterStatus.success} message={newsletterStatus.message} />
        )}
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center"></footer>
    </div>
  )
}

import { PrismaClient, TopicStatus } from '@prisma/client'

const prisma = new PrismaClient()

const topics = [
  {
    title: 'Artificial Intelligence Ethics',
    description: 'Exploring the ethical implications of AI development and deployment.',
  },
  {
    title: 'Quantum Computing',
    description: 'Understanding the basics of quantum computing and its potential applications.',
  },
  {
    title: 'Space Exploration',
    description: 'Recent developments in space exploration and future missions.',
  },
  {
    title: 'Climate Technology',
    description: 'Technologies being developed to combat climate change.',
  },
  {
    title: 'Blockchain Beyond Cryptocurrency',
    description: 'Non-financial applications of blockchain technology.',
  },
  {
    title: 'Neural Interfaces',
    description: 'The progress in brain-computer interfaces and neural implants.',
  },
  {
    title: 'Biotechnology Advancements',
    description: 'Latest breakthroughs in biotech and genetic engineering.',
  },
  {
    title: 'Robotics in Healthcare',
    description: 'How robots are transforming healthcare delivery and research.',
  },
  {
    title: 'Future of Transportation',
    description: 'Emerging technologies in transportation systems.',
  },
  {
    title: 'Internet of Things Security',
    description: 'Security challenges and solutions in IoT ecosystems.',
  },
]

async function main() {
  console.log('Starting to seed newsletter topics...')

  let createdCount = 0
  for (const topic of topics) {
    const existingTopic = await prisma.newsletterTopic.findFirst({
      where: {
        title: topic.title,
      },
    })

    if (!existingTopic) {
      await prisma.newsletterTopic.create({
        data: {
          title: topic.title,
          description: topic.description,
          status: TopicStatus.SUGGESTED,
          electionsParticipated: 0,
        },
      })
      createdCount++
    }
  }

  console.log(`Seeded ${createdCount} new newsletter topics.`)

  // Start the first election cycle with 3 random topics
  const { handleNewElectionCycle } = await import('../pages/api/newsletter/select-topics')
  const result = await handleNewElectionCycle()

  if (result.success) {
    console.log('Started first election cycle with topics:', result.selectedTopicIds)
  } else {
    console.error('Failed to start election cycle:', result.error)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

import habitBot from './habitBot/habitBot'
import quippetBot from './quippetBot'

const bots = {
  habitBot,
  quippetBot,
} as const

// Get bot from arg
const bot = process.argv[2] as keyof typeof bots

// If bot not key of bots, throw error
if (!bots[bot]) {
  throw new Error(`Invalid bot name: ${bot}`)
}

bots[bot].launch()

import { User } from '@prisma/client'
import { OpenAI } from 'openai'
import type { Context, Scenes } from 'telegraf'
import { Telegraf } from 'telegraf'
import { message } from 'telegraf/filters'
import attachUser from '../../middlewares/attachUser'
import sessionMiddleware from '../../middlewares/session'

if (!process.env.PROTEIN_BOT_TOKEN) throw new Error('PROTEIN_BOT_TOKEN is required')
if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is required')

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

interface ProteinSession extends Scenes.SceneSession {
  dailyProtein: number
  lastUpdated: string // ISO date string for the day
}

// Extend context type to include user and protein tracking
export interface ProteinContext extends Context {
  user: User
  session: ProteinSession
  scene: Scenes.SceneContextScene<ProteinContext>
}

const proteinBot = new Telegraf<ProteinContext>(process.env.PROTEIN_BOT_TOKEN)

// Add middleware for session persistence and user attachment
proteinBot.use(Telegraf.log())
proteinBot.use(sessionMiddleware)
proteinBot.use(attachUser)

// Initialize or reset daily protein count at start of new day
const initializeDailyProtein = (ctx: ProteinContext) => {
  const today = new Date().toISOString().split('T')[0]
  if (!ctx.session?.dailyProtein || ctx.session?.lastUpdated !== today) {
    ctx.session = {
      ...ctx.session,
      dailyProtein: 0,
      lastUpdated: today,
    }
  }
}

// Helper to analyze protein content using GPT
const analyzeProteinContent = async (input: string): Promise<number> => {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content:
          'You are a nutritionist specialized in protein content analysis. Extract the approximate protein content in grams from the food description provided. Return ONLY the number, nothing else.',
      },
      {
        role: 'user',
        content: input,
      },
    ],
  })

  console.log('Protein content:', response.choices[0].message.content)

  const proteinContent = Number(response.choices[0].message.content)
  return isNaN(proteinContent) ? 0 : proteinContent
}

// Handle image messages
proteinBot.on(message('photo'), async ctx => {
  try {
    initializeDailyProtein(ctx)

    // Get photo caption or ask for description
    const caption = ctx.message.caption
    if (!caption) {
      return ctx.reply('Please send the image with a description of the food in the caption.')
    }

    const proteinContent = await analyzeProteinContent(caption)
    ctx.session.dailyProtein += proteinContent

    await ctx.reply(
      `Added ${proteinContent}g of protein\nTotal protein today: ${ctx.session.dailyProtein}g`,
    )
  } catch (error) {
    console.error('Error processing image:', error)
    await ctx.reply('Sorry, I had trouble analyzing that. Please try again.')
  }
})

// Command to check total protein intake for the day
proteinBot.command('total', async ctx => {
  initializeDailyProtein(ctx)
  await ctx.reply(`Total protein intake today: ${ctx.session.dailyProtein}g`)
})

// Command to reset protein count
proteinBot.command('reset', async ctx => {
  ctx.session = {
    dailyProtein: 0,
    lastUpdated: new Date().toISOString().split('T')[0],
  }
  await ctx.reply('Daily protein count has been reset to 0g')
})

// Help command
proteinBot.command('help', async ctx => {
  const helpMessage = `
🥩 Protein Tracker Bot Help 🥩

Send me food in any of these ways:
- Text description of what you ate
- Photo with caption describing the food

Commands:
/total - Check your total protein intake for today
/reset - Reset your daily protein count
/help - Show this help message

Tips:
- Be specific in your food descriptions
- Include quantities when possible
- For photos, always add a description in the caption
`
  await ctx.reply(helpMessage)
})

// Start command
proteinBot.command('start', async ctx => {
  await ctx.reply('Welcome to Protein Tracker Bot! 🥩\nUse /help to see available commands.')
})

// Handle text messages
proteinBot.on(message('text'), async ctx => {
  try {
    initializeDailyProtein(ctx)

    const proteinContent = await analyzeProteinContent(ctx.message.text)
    ctx.session.dailyProtein += proteinContent

    await ctx.reply(
      `Added ${proteinContent}g of protein\nTotal protein today: ${ctx.session.dailyProtein}g`,
    )
  } catch (error) {
    console.error('Error processing text message:', error)
    await ctx.reply('Sorry, I had trouble analyzing that. Please try again.')
  }
})

export default proteinBot

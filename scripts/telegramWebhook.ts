import axios from 'axios'
import * as dotenv from 'dotenv'

// Set default environment to `prod` if no `--env` flag is provided
const env = process.argv.includes('--env')
  ? process.argv[process.argv.indexOf('--env') + 1]
  : 'prod'

// Load the environment variables from the chosen .env file
dotenv.config({ path: `.env.${env}` })

const BOTS = ['habit', 'quippet']

const command = process.argv[2]
const bot = process.argv[3]

if (!command) {
  throw new Error('Command is required')
}

if (!bot || !BOTS.includes(bot)) {
  throw new Error('Valid Bot is required')
}

const formatBotURL = (bot: string) => {
  return `${process.env.WEBHOOK_SERVER_URL}/${bot}-bot`
}

async function setWebhook(botToken: string, webhookUrl: string) {
  console.log('Setting webhook for bot with URL:', webhookUrl)
  const response = await axios.post(
    `https://api.telegram.org/bot${botToken}/setWebhook?url=${webhookUrl}`
  )
  console.log(response.data)

  return response.data
}

async function getWebhookInfo(botToken: string) {
  const response = await axios.get(`https://api.telegram.org/bot${botToken}/getWebhookInfo`)
  console.log(response.data)

  return response.data
}

const botToken = process.env[`${bot.toUpperCase()}_BOT_TOKEN`]

if (!botToken) {
  throw new Error(`${bot.toUpperCase()}_BOT_TOKEN is required`)
}

if (command === 'get') {
  getWebhookInfo(botToken)
} else if (command === 'set') {
  if (!process.env.WEBHOOK_SERVER_URL) {
    throw new Error('WEBHOOK_SERVER_URL is required')
  }
  const webhookUrl = formatBotURL(bot)
  setWebhook(botToken, webhookUrl)
} else if (command === 'unset') {
  setWebhook(botToken, '')
}

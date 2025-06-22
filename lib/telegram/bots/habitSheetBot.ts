import attachUser from '@/lib/telegram/middlewares/attachUser'
import type { HabitSheetContext } from '@/lib/telegram/types'
import { google } from 'googleapis'
import { Markup, Telegraf, session } from 'telegraf'
import { message } from 'telegraf/filters'
import PostgresSessionStore from '../middlewares/session/sessionStore'

// Service account email for users to share their sheets with
const SERVICE_ACCOUNT_EMAIL = 'habit-sheet-bot@local-bebop-340419.iam.gserviceaccount.com'

// Helper function to extract sheet ID from URL
function extractSheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  return match ? match[1] : null
}

// Helper function to read sheet data
async function readHabitSheet(spreadsheetId: string, sheetName: string = 'June') {
  if (!process.env.GOOGLE_CREDENTIALS_JSON) {
    throw new Error('GOOGLE_CREDENTIALS_JSON is not set')
  }

  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON)

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })

  const sheets = google.sheets({ version: 'v4', auth })

  // Get available sheets first
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId,
  })

  const availableSheets = spreadsheet.data.sheets?.map((sheet) => sheet.properties?.title) || []

  // Try to get data from the specified sheet
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: sheetName,
  })

  return {
    data: response.data.values || [],
    availableSheets,
  }
}

const HABIT_SHEET_COMMANDS = [
  {
    name: 'setup',
    description: 'Set up your Google Sheet access',
    action: async (ctx: HabitSheetContext) => {
      const message = `📊 *Google Sheet Setup Required*

*Step 1:* Share your Google Sheet
• Open your Google Sheet
• Click "Share" button \\(top right\\)
• Add this email with "Viewer" access:
\`${SERVICE_ACCOUNT_EMAIL.replace(/[-.]/g, '\\$&')}\`

*Step 2:* Send me your Google Sheet URL
• Copy the full URL from your browser
• It should look like: https://docs\\.google\\.com/spreadsheets/d/YOUR\\_SHEET\\_ID/edit
• Paste it in your next message

⚠️ *Both steps are required for the bot to access your sheet\\!*`

      await ctx.replyWithMarkdownV2(message)
    },
  },
  {
    name: 'sheet',
    description: 'View your current sheet info and data',
    action: async (ctx: HabitSheetContext) => {
      if (!ctx.session.habitSheetURL || !ctx.session.habitSheetId) {
        return ctx.reply('❌ No Google Sheet configured. Use /setup to configure your sheet.')
      }

      try {
        await ctx.reply('📊 Fetching your sheet data...')

        const { data, availableSheets } = await readHabitSheet(ctx.session.habitSheetId)

        await ctx.reply(
          `📊 **Your Google Sheet Info**\n\n` +
            `🔗 URL: ${ctx.session.habitSheetURL}\n` +
            `📋 Available sheets: ${availableSheets.join(', ')}\n` +
            `📈 Current data rows: ${data.length}\n\n` +
            "Use /data to see your current month's habit tracking data."
        )
      } catch (error) {
        console.error('Error reading sheet:', error)
        await ctx.reply(
          '❌ **Error accessing your sheet**\n\n' +
            'Please make sure:\n' +
            `• Your sheet is shared with: \`${SERVICE_ACCOUNT_EMAIL}\`\n` +
            '• The sheet URL is correct\n' +
            '• The sheet is accessible\n\n' +
            'Use /setup to reconfigure if needed.'
        )
      }
    },
  },
  {
    name: 'data',
    description: 'View your current habit tracking data',
    action: async (ctx: HabitSheetContext) => {
      if (!ctx.session.habitSheetId) {
        return ctx.reply('❌ No Google Sheet configured. Use /setup first.')
      }

      try {
        await ctx.reply('📊 Fetching your current habit data...')

        const currentMonth = new Date().toLocaleString('default', { month: 'long' })
        const { data } = await readHabitSheet(ctx.session.habitSheetId, currentMonth)

        if (data.length === 0) {
          return ctx.reply(
            `❌ No data found in the "${currentMonth}" sheet. Make sure the sheet exists and has data.`
          )
        }

        let summary = `📊 *${currentMonth} Habit Summary*\n\n`

        // Skip the first three rows (headers) and process habit rows
        for (let i = 3; i < data.length; i++) {
          const row = data[i]
          if (!row || row.length === 0) continue

          const habitName = row[0]
          const habitData = row.slice(1).filter((cell) => cell !== undefined && cell !== null)

          if (!habitName || habitData.length === 0) continue

          // Check if this is number data or boolean data
          const isNumberData = habitData.some((cell) => {
            const num = parseFloat(cell)
            return !isNaN(num) && cell !== 'TRUE' && cell !== 'FALSE'
          })

          if (isNumberData) {
            // Calculate cumulative sum for number data
            const numbers = habitData
              .filter((cell) => cell !== '' && cell !== 'FALSE' && cell !== 'TRUE')
              .map((cell) => parseFloat(cell))
              .filter((num) => !isNaN(num))

            const total = numbers.reduce((sum, num) => sum + num, 0)
            const daysWithData = numbers.length

            if (total > 0) {
              summary += `${habitName}: ${total} total (${daysWithData} days)\n`
            }
          } else {
            // Calculate current streak for boolean data
            let currentStreak = 0
            for (let j = habitData.length - 1; j >= 0; j--) {
              if (habitData[j] === 'TRUE') {
                currentStreak++
              } else if (habitData[j] === 'FALSE') {
                break
              }
              // Skip empty cells and continue counting
            }

            const completedDays = habitData.filter((day) => day === 'TRUE').length

            if (currentStreak > 3) {
              summary += `${habitName}: ${completedDays} days (🔥 ${currentStreak} streak)\n`
            } else if (completedDays > 0) {
              summary += `${habitName}: ${completedDays} days\n`
            }
          }
        }

        if (summary === `📊 *${currentMonth} Habit Summary*\n\n`) {
          summary += 'No habit data found for this month.'
        }

        await ctx.replyWithMarkdownV2(summary.replace(/[-.!()]/g, '\\$&'))
      } catch (error) {
        console.error('Error reading sheet data:', error)
        await ctx.reply(
          '❌ **Error reading your habit data**\n\n' +
            'Please check that your sheet is properly configured and accessible.\n' +
            'Use /sheet to verify your setup.'
        )
      }
    },
  },
  {
    name: 'help',
    description: 'Show available commands',
    action: async (ctx: HabitSheetContext) => {
      const helpMessage = `
🏃‍♂️ **Habit Sheet Bot**

I help you track habits using your Google Sheet!

**Available Commands:**
${HABIT_SHEET_COMMANDS.map((cmd) => `  /${cmd.name} - ${cmd.description}`).join('\n')}

${
  !ctx.session.habitSheetURL
    ? '\n⚠️ **Setup Required:** Use /setup to configure your Google Sheet access first!'
    : '\n✅ **Sheet Configured:** Your Google Sheet is ready to use!'
}
      `
      await ctx.replyWithMarkdownV2(
        helpMessage.replace(/[-.!()]/g, '\\$&'),
        Markup.removeKeyboard()
      )
    },
  },
]

const DEFAULT_MESSAGE = `
🏃‍♂️ **Habit Sheet Bot**

I help you track habits using your Google Sheet!

⚠️ **Setup Required:** Please use /setup to configure your Google Sheet access first.

**Quick Setup:**
1. Share your Google Sheet with: \`${SERVICE_ACCOUNT_EMAIL}\`
2. Use /setup and paste your sheet URL

Available commands:
${HABIT_SHEET_COMMANDS.map((cmd) => `  /${cmd.name} - ${cmd.description}`).join('\n')}
`

// Custom session middleware for habit sheet bot
const habitSheetSessionMiddleware = session({
  getSessionKey: ({ chat }) => chat?.id.toString() ?? '',
  store: new PostgresSessionStore(),
  defaultSession: () => ({
    habitMeta: {},
    step: 0,
    habitSheetURL: undefined,
    habitSheetId: undefined,
  }),
})

// Middleware to require habitSheetURL for most commands
const requireHabitSheetURL = () => {
  return async (ctx: HabitSheetContext, next: any) => {
    // Allow these commands without sheet URL
    const allowedWithoutSheet = ['setup', 'help', 'start']

    if (ctx.message && 'text' in ctx.message) {
      const text = ctx.message.text
      const isCommand = text.startsWith('/')
      const command = isCommand ? text.slice(1).split(' ')[0] : null

      // Allow commands that don't require sheet URL
      if (isCommand && allowedWithoutSheet.includes(command || '')) {
        return next()
      }

      // Allow Google Sheets URLs for setup
      if (text.includes('docs.google.com/spreadsheets') || text.includes('sheets.google.com')) {
        return next()
      }
    }

    // Check if user has habitSheetURL set
    if (!ctx.session.habitSheetURL) {
      return ctx.reply(
        '❌ Please set up your Google Sheet URL first using /setup\n\n' +
          '📊 I need to know which Google Sheet to work with before I can help you track habits!'
      )
    }

    return next()
  }
}

if (!process.env.HABIT_SHEET_BOT_TOKEN) {
  throw new Error('HABIT_SHEET_BOT_TOKEN is required')
}

const habitSheetBot = new Telegraf<HabitSheetContext>(process.env.HABIT_SHEET_BOT_TOKEN)

// Middleware setup
habitSheetBot.use(Telegraf.log())
habitSheetBot.use(habitSheetSessionMiddleware)
habitSheetBot.use(attachUser)
habitSheetBot.use(requireHabitSheetURL())

habitSheetBot.catch(async (error: any, ctx) => {
  console.error('Error in habitSheetBot:', error)
  await ctx.reply('❌ An error occurred. Please try again.')
})

// Register commands
for (const { name, action } of HABIT_SHEET_COMMANDS) {
  habitSheetBot.command(name, action)
}

// Handle Google Sheet URL input after /setup command
habitSheetBot.on(message('text'), async (ctx) => {
  const text = ctx.message.text

  // Check if this looks like a Google Sheets URL
  if (text.includes('docs.google.com/spreadsheets') || text.includes('sheets.google.com')) {
    // Validate and save the URL
    try {
      new URL(text) // Basic URL validation

      const sheetId = extractSheetId(text)
      if (!sheetId) {
        return await ctx.reply(
          '❌ **Could not extract Sheet ID from URL**\n\n' +
            'Please make sure the URL looks like:\n' +
            '`https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit`'
        )
      }

      // Test access to the sheet
      try {
        await ctx.reply('🔄 **Testing access to your sheet...**')
        const { availableSheets } = await readHabitSheet(sheetId)

        ctx.session.habitSheetURL = text
        ctx.session.habitSheetId = sheetId

        await ctx.reply(
          '✅ **Google Sheet connected successfully!**\n\n' +
            `📊 Sheet: ${text}\n` +
            `📋 Available sheets: ${availableSheets.join(', ')}\n\n` +
            'You can now use all bot features:\n' +
            '• /sheet - View sheet info\n' +
            '• /data - View current habit data\n' +
            '• /help - See all commands'
        )
      } catch (error) {
        console.error('Error testing sheet access:', error)
        await ctx.reply(
          '❌ **Cannot access your sheet**\n\n' +
            'Please make sure:\n' +
            `• You shared the sheet with: \`${SERVICE_ACCOUNT_EMAIL}\`\n` +
            '• The email has "Viewer" permissions\n' +
            '• The sheet URL is correct\n\n' +
            '💡 Try the /setup command again for detailed instructions.'
        )
      }
    } catch (error) {
      await ctx.reply(
        '❌ **Invalid URL format**\n\n' +
          'Please provide a valid Google Sheets URL that looks like:\n' +
          '`https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit`'
      )
    }
  } else if (!text.startsWith('/')) {
    // If user has sheet URL, this could be habit tracking input
    if (ctx.session.habitSheetURL) {
      await ctx.reply(
        '📝 **Habit tracking coming soon!**\n\n' +
          'This feature will allow you to log habits directly to your Google Sheet.\n\n' +
          'For now, use /sheet to view your configured sheet URL.'
      )
    } else {
      await ctx.reply(
        '❓ **Not sure what you mean**\n\n' +
          'Use /setup to configure your Google Sheet, or /help for available commands.'
      )
    }
  } else {
    // Unknown command
    await ctx.replyWithMarkdownV2(
      DEFAULT_MESSAGE.replace(/[-.!()]/g, '\\$&'),
      Markup.removeKeyboard()
    )
  }
})

// Start command
habitSheetBot.start(async (ctx) => {
  await ctx.replyWithMarkdownV2(
    DEFAULT_MESSAGE.replace(/[-.!()]/g, '\\$&'),
    Markup.removeKeyboard()
  )
})

export default habitSheetBot

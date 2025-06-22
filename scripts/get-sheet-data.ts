import 'dotenv/config'
import { google } from 'googleapis'

if (!process.env.GOOGLE_CREDENTIALS_JSON) {
  throw new Error('GOOGLE_CREDENTIALS_JSON is not set')
}

async function readSheetData() {
  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON ?? '')

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })

  const sheets = google.sheets({ version: 'v4', auth })

  const spreadsheetId = '1gFBy5oCUkri4duZLWabYCHp6jrYuro14jBtWbdjqIrs' // from sheet URL

  // First, let's see what sheets are available
  console.log('Getting spreadsheet info...')
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId,
  })

  console.log('Available sheets:')
  spreadsheet.data.sheets?.forEach((sheet) => {
    console.log(`- "${sheet.properties?.title}"`)
  })

  // Now try to get data from June sheet
  const range = 'June' // get all data from the June sheet
  console.log(`\nTrying to get data from sheet: ${range}`)

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  })

  const rows = response.data.values
  console.log('Data:', rows)
}

readSheetData().catch(console.error)

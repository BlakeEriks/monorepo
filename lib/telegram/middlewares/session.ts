import { session } from 'telegraf'
import PostgresSessionStore from './session/sessionStore'

const sessionMiddleware = session({
  getSessionKey: ({ chat }) => chat?.id.toString() ?? '',
  store: new PostgresSessionStore(),
  defaultSession: () => ({ recentValues: {}, step: 0 }),
})

export default sessionMiddleware

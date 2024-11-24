import { Scenes } from 'telegraf'
import { Session } from './sequelize'

class PostgresSessionStore {
  async get<T extends Scenes.SceneSession>(chatId: string): Promise<T | undefined> {
    try {
      const session = await Session.findOne({ where: { chatId } })
      console.log('get method found session:', session)
      return session ? (session.data as T) : undefined
    } catch (error) {
      console.error(`Error setting session data for chatId ${chatId}:`, error)
    }
  }

  async set(chatId: string, data: object): Promise<void> {
    console.log(`Setting session for chatId: ${chatId}`, data)
    try {
      await Session.upsert({
        chatId,
        data,
      })
      console.log(`Session data for chatId ${chatId} set successfully.`)
    } catch (error) {
      console.error(`Error setting session data for chatId ${chatId}:`, error)
    }
  }

  async delete(chatId: string): Promise<void> {
    console.log(`Deleting session for chatId: ${chatId}`)
    try {
      await Session.destroy({ where: { chatId } })
      console.log(`Session for chatId ${chatId} deleted successfully.`)
    } catch (error) {
      console.error(`Error deleting session for chatId ${chatId}:`, error)
    }
  }
}

export default PostgresSessionStore

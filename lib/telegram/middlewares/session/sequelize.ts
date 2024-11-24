import { Sequelize } from 'sequelize'
import createSession from './createSession'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required for session storage')
}

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  dialectModule: require('pg'),
  logging: console.log,
  dialectOptions: {
    connectTimeout: 60000,
  },
})

sequelize
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully.')
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err)
  })

const Session = createSession(sequelize)

sequelize.sync()

export { Session }

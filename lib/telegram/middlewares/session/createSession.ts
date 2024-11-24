import { DataTypes, Model, Sequelize } from 'sequelize'

const createSession = (sequelize: Sequelize) => {
  class Session extends Model {
    declare chatId: string
    declare data: object
  }

  Session.init(
    {
      chatId: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      data: {
        type: DataTypes.JSONB,
      },
    },
    {
      sequelize,
      modelName: 'session',
      tableName: 'sessions',
    }
  )

  return Session
}

export default createSession

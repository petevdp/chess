import faker from 'faker'
import uuidv4 from 'uuid/v4'
import { UserDetails, BotDetails } from '../types'
import { ChessEngineName } from '../../bots/engines'

export function genFakeUser (): UserDetails {
  return {
    id: uuidv4(),
    username: faker.fake("{{{internet.userName}}"),
    type: 'bot',
    description: faker.fake('{{{hacker.phrase}}}')
  }
}

export function genFakeBot (
  delay: number|[number, number],
  engineName: ChessEngineName = 'random'
): BotDetails {
  return {
    id: uuidv4(),
    username: faker.internet.userName(),
    type: 'bot',
    engineName: engineName,
    engineOptions: {
      delay
    }
  }
}

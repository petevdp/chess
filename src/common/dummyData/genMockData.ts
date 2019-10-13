import faker from 'faker'
import uuidv4 from 'uuid/v4'
import { UserDetails, BotDetails } from '../types'

export function genFakeUser (): UserDetails {
  return {
    id: uuidv4(),
    username: faker.fake("{{{internet.userName}}"),
    type: 'bot'
  }
}

export function genFakeBot (): BotDetails {
  return {
    id: uuidv4(),
    username: faker.internet.userName(),
    type: 'bot',
    engineName: 'random',
    delay: 400
  }
}

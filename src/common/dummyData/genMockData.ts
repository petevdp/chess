import faker from 'faker'
import uuidv4 from 'uuid/v4'
import { UserDetails } from '../types'

export function genFakeUser (): UserDetails {
  return {
    id: uuidv4(),
    username: faker.fake("{{{internet.userName}}"),
    type: 'bot'
  }
}


export function genFakeGame () {
}
import { UserDetails } from "../../../common/types"
import { getLobbyConnectionPair } from "./helpers"
import { EMPTY } from "rxjs"
import Game from "../game"
jest.mock('../game')

const user1: UserDetails = {
  id: 'u1',
  username: 'user1',
  type: 'bot'
}

// const player1: PlayerDetails = {
//   user: user1,
//   colour: 'w'
// }

const user2: UserDetails = {
  id: 'u2',
  username: 'user2',
  type: 'bot'
}

// const player2: PlayerDetails = {
//   user: user2,
//   colour: 'b'
// }

it('sends joinGame messages to connections on instantiation', () => {
  const [conn1, member1] = getLobbyConnectionPair(EMPTY, user1)
  const [conn2, member2] = getLobbyConnectionPair(EMPTY, user2)

  const game = new Game([member1, member2])
  game

  .expect(conn1.sendMessage.mock.calls[0].game.type).toBe('join')
  expect(conn2.sendMessage.mock.calls[0].game.type).toBe('join')
})

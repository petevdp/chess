import { UserDetails } from "../../../common/types"
import { getLobbyMemberConnectionPair } from "./helpers"
import { EMPTY } from "rxjs"
import Game from "../game"

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
  const [conn1, member1] = getLobbyMemberConnectionPair(EMPTY, user1)
  const [conn2, member2] = getLobbyMemberConnectionPair(EMPTY, user2)

  const game = new Game([member1, member2])

  expect(conn1.sendMessage.mock.calls[0][0].game.type).toEqual('join')
  expect(conn2.sendMessage.mock.calls[0][0].game.type).toEqual('join')

  game.end()
})

it('sets the lobbyMembers ingame state to the gameid', () => {
  const [, member1] = getLobbyMemberConnectionPair(EMPTY, user1)
  const [, member2] = getLobbyMemberConnectionPair(EMPTY, user2)

  const game = new Game([member1, member2])

  expect(member1.state.currentGame).toEqual(game.id)
})

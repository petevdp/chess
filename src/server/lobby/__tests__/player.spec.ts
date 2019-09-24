import { getPlayerConnectionPair } from './helpers'
import { CompleteGameInfo, UserDetails, PlayerDetails, SocketServerMessage, SocketClientMessage, GameUpdate } from '../../../common/types'
import { Chess } from 'chess.js'
import { EMPTY, Subject, of } from 'rxjs'

const user1: UserDetails = {
  id: 'u1',
  username: 'user1',
  type: 'bot'
}

const player1: PlayerDetails = {
  user: user1,
  colour: 'w'
}

const user2: UserDetails = {
  id: 'u2',
  username: 'user2',
  type: 'bot'
}

const player2: PlayerDetails = {
  user: user2,
  colour: 'b'
}

const game1: CompleteGameInfo = {
  id: 'game1',
  playerDetails: [
    player1, player2
  ],
  history: new Chess().pgn()
}

const update1: GameUpdate = {
  type: 'move',
  move: { from: 'a2', to: 'a4' }
}

const updateMessage1: SocketServerMessage = {
  game: {
    type: 'update',
    update: {
      id: game1.id,
      ...update1
    }
  }
}

it('sends join message to client on instantiation', () => {
  const [conn] = getPlayerConnectionPair(EMPTY, EMPTY, game1, user1)

  expect(conn.sendMessage).toHaveBeenCalledWith({
    game: {
      type: 'join',
      join: game1
    }
  } as SocketServerMessage)
})

it('sends update messages to client', () => {
  const clientMessageSubject = new Subject<SocketClientMessage>()
  const [conn] = getPlayerConnectionPair(clientMessageSubject, of(update1), game1, user1)

  expect(conn.sendMessage).toHaveBeenCalledWith(updateMessage1 as SocketServerMessage)
})

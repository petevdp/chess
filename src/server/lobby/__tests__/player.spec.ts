import { getPlayerConnectionPair } from './helpers'
import { CompleteGameInfo, UserDetails, PlayerDetails, SocketServerMessage, SocketClientMessage, GameUpdate, ClientPlayerAction } from '../../../common/types'
import { Chess, ShortMove } from 'chess.js'
import { EMPTY, Subject, of } from 'rxjs'
import { PlayerAction } from '../player'

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

const move1: ShortMove = {
  from: 'a2',
  to: 'a4'
}

const update1: GameUpdate = {
  type: 'move',
  move: move1
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

const clientPlayerAction1: ClientPlayerAction = {
  type: 'move',
  move: move1,
  gameId: game1.id
}

const playerAction1: PlayerAction = {
  ...clientPlayerAction1,
  playerId: player1.user.id,
  colour: player1.colour
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
  const [conn] = getPlayerConnectionPair(EMPTY, of(update1), game1, user2)

  expect(conn.sendMessage).toHaveBeenCalledWith(updateMessage1 as SocketServerMessage)
})

it('receives actions from client', done => {
  const clientMessage$ = new Subject<SocketClientMessage>()

  const message: SocketClientMessage = {
    gameAction: clientPlayerAction1
  }

  const [, player] = getPlayerConnectionPair(clientMessage$, EMPTY, game1, user1)
  player.playerAction$.subscribe({
    next: action => {
      expect(action).toEqual(playerAction1)
      done()
    }
  })

  clientMessage$.next(message)
})

import { getPlayerConnectionPair } from './helpers'
import { CompleteGameInfo, SocketServerMessage, SocketClientMessage, GameUpdate, ClientPlayerAction } from '../../../common/types'
import { Chess } from 'chess.js'
import { EMPTY, Subject, of } from 'rxjs'
import { PlayerAction } from '../player'
import { moves, playerDetails } from '../../../common/dummyData'

const game1: CompleteGameInfo = {
  id: 'game1',
  playerDetails: playerDetails.slice(0, 2),
  pgn: new Chess().pgn()
}

const update1: GameUpdate = {
  type: 'move',
  move: moves[0]
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
  move: moves[0],
  gameId: game1.id
}

const playerAction1: PlayerAction = {
  ...clientPlayerAction1,
  playerId: playerDetails[0].user.id,
  colour: playerDetails[0].colour
}

it('sends join message to client on instantiation', () => {
  const [conn] = getPlayerConnectionPair(EMPTY, EMPTY, game1, playerDetails[0])

  expect(conn.sendMessage).toHaveBeenCalledWith({
    game: {
      type: 'join',
      join: game1
    }
  } as SocketServerMessage)
})

it('sends update messages to client', () => {
  const [conn] = getPlayerConnectionPair(EMPTY, of(update1), game1, game1.playerDetails[1])

  expect(conn.sendMessage).toHaveBeenCalledWith(updateMessage1 as SocketServerMessage)
})

it('receives actions from client', done => {
  const clientMessage$ = new Subject<SocketClientMessage>()

  const message: SocketClientMessage = {
    gameAction: clientPlayerAction1
  }

  const [, player] = getPlayerConnectionPair(clientMessage$, EMPTY, game1, playerDetails[0])
  player.playerAction$.subscribe({
    next: action => {
      expect(action).toEqual(playerAction1)
      done()
    }
  })

  clientMessage$.next(message)
})

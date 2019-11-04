import {
  SocketClientMessage,
  SocketServerMessage,
  GameInfo,
  PlayerDetails,
  UserDetails,
  ClientPlayerAction
} from '../../common/types'
import { Chess } from 'chess.js'
import { BotClient } from '../botClient'
import { MoveMaker } from '../../common/gameProviders'
import { from, Subject, Observable } from 'rxjs'
import { moveUpdates, moves } from '../../common/dummyData/dummyData'
import { take, publish } from 'rxjs/operators'

const user1: UserDetails = {
  id: 'u1',
  username: 'user1',
  type: 'bot',
  description: 'I\'m user1'
}

const player1: PlayerDetails = {
  user: user1,
  elo: 1500,
  colour: 'w'
}

const user2: UserDetails = {
  id: 'u2',
  username: 'user2',
  type: 'bot',
  description: 'I\'m user2'
}

const player2: PlayerDetails = {
  user: user2,
  colour: 'b',
  elo: 1500
}

const game1: GameInfo = {
  id: 'game1',
  playerDetails: [player1, player2],
  pgn: new Chess().pgn()
}

const game2: GameInfo = {
  id: 'game2',
  playerDetails: [player1, player2],
  pgn: new Chess().pgn()
}

const joinGameMsg1: SocketServerMessage = {
  game: {
    type: 'join',
    join: game1
  }
}

const joinGameMsg2: SocketServerMessage = {
  game: {
    type: 'join',
    join: game2
  }
}

const gameUpdateMessage1: SocketServerMessage = {
  game: {
    type: 'update',
    update: moveUpdates[0]
  }
}

it('can respond to a game update', (done) => {
  const message$ = publish<SocketServerMessage>()(from([joinGameMsg1, gameUpdateMessage1]))
  const expectedMove = moves[1]
  const expectedClientAction: ClientPlayerAction = {
    gameId: game1.id,
    type: 'move',
    move: expectedMove
  }

  const engine: MoveMaker = async () => expectedMove
  const response = (msg: SocketClientMessage) => {
    expect(msg.gameAction).toEqual(expectedClientAction)
    done()
  }

  const client = new BotClient(user2, message$, response, engine)

  message$.connect()
  client.disconnect()
})

it('can play two successsive games', done => {
  const gameResignMessage: SocketServerMessage = {
    game: {
      type: 'update',
      update: {
        id: '1',
        type: 'end',
        end: {
          reason: 'resign',
          winnerId: 'id1'
        }
      }
    }
  }
  const updateGame2: SocketServerMessage = {
    game: {
      type: 'update',
      update: {
        id: 'game2',
        type: 'move',
        move: moves[0]
      }
    }
  }

  const message$: Observable<SocketServerMessage> = from([
    joinGameMsg1,
    gameUpdateMessage1,
    gameResignMessage,
    joinGameMsg2,
    updateGame2
  ])

  const expectedMove = moves[1]

  const engine: MoveMaker = async () => expectedMove
  const response$ = new Subject()
  const response = (msg: SocketClientMessage) => {
    response$.next(msg)
  }

  response$.pipe(
    take(2)
  ).subscribe({
    next: () => console.log('response!'),
    complete: () => {
      response$.complete()
      done()
    }
  })

  const client = new BotClient(user2, message$, response, engine)
})

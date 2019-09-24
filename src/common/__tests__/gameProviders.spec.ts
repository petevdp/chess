import { GameUpdateWithId, CompleteGameInfo, UserDetails, PlayerDetails } from '../types'
import { GameStream, GameClient, MoveMaker } from '../gameProviders'
import { of, from, EMPTY, NEVER } from 'rxjs'
import * as Engines from '../../bots/engines'
import { skip } from 'rxjs/operators'
import { Chess } from 'chess.js'

const moveUpdates: GameUpdateWithId[] = [
  {
    type: 'move',
    move: { from: 'a2', to: 'a4' },
    id: 'game1'
  },
  {
    type: 'move',
    move: { from: 'a7', to: 'a5' },
    id: 'game1'
  }
]

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

const resignUpdate = {
  type: 'end',
  end: {
    reason: 'resign',
    winnerId: 'player1'
  }
} as GameUpdateWithId

const newGame = (chess = new Chess()): CompleteGameInfo => ({
  id: 'game1',
  playerDetails: [
    player1, player2
  ],
  history: chess.pgn()
})

describe('GameStream', () => {
  it('publishes updated ChessInstance on moves', done => {
    const game = newGame()
    const stream = new GameStream(of(moveUpdates[0]), game)
    stream.move$.pipe(skip(1)).subscribe(chess => {
      expect(chess.history()[0]).toEqual('a4')
      done()
    })
  })

  it('maintains state between moves', done => {
    const game = newGame()
    const stream = new GameStream(from(moveUpdates), game)
    const resultFEN = 'rnbqkbnr/1ppppppp/8/p7/P7/8/1PPPPPPP/RNBQKBNR w KQkq a6 0 2'
    stream.move$.pipe(skip(2)).subscribe(chess => {
      expect(chess.fen()).toEqual(resultFEN)
      done()
    })
  })

  it('broadcasts an endState', done => {
    const game = newGame()
    const stream = new GameStream(of(resignUpdate), game)
    stream.end$.subscribe(endState => {
      expect(endState).toEqual(resignUpdate.end)
      done()
    })
  })

  it('allows custom starting positions', done => {
    const someFEN = 'rnbqkbnr/1ppppppp/8/p7/P7/8/1PPPPPPP/RNBQKBNR w KQkq a6 0 2'
    const game = newGame(new Chess(someFEN))
    const stream = new GameStream(EMPTY, game)
    stream.move$.subscribe(chess => {
      expect(chess.fen()).toEqual(someFEN)
      done()
    })
  })
})

describe('GameClient', () => {
  describe('calls to getMove', () => {
    it('is called when opponent moves', (done) => {
      const mockMoveMaker = jest.fn(move => {
        done()
        return Engines.firstMoveEngine(move)
      })

      const client = new GameClient(
        of(moveUpdates[0]),
        newGame(),
        user2,
        mockMoveMaker
      )

      client.action$.subscribe({
        complete: () => { }
      })

      client.complete()
    })

    it('is not called when opponent has yet to move', done => {
      const mockMoveMaker = jest.fn(Engines.firstMoveEngine)
      const client = new GameClient(
        EMPTY,
        newGame(),
        user2,
        mockMoveMaker
      )

      client.gameUpdate$.subscribe({
        complete: () => {
          expect(mockMoveMaker.mock.calls.length).toEqual(0)
          done()
        }
      })
    })

    it('calls moveMaker on new game when player is white', done => {
      const moveMaker: MoveMaker = chess => {
        return Engines.firstMoveEngine(chess)
      }
      const client = new GameClient(
        NEVER,
        newGame(),
        user1,
        moveMaker
      )

      client.action$.subscribe({
        next: () => {
          done()
        },
        complete: () => {
          done.fail(new Error('completed for some reason'))
        }
      })
    })
  })

  describe('endPromise', () => {
    it('ends when issued an gameUpdate of type end', done => {
      const client = new GameClient(
        of(resignUpdate),
        newGame(),
        user2,
        Engines.firstMoveEngine
      )

      client.endPromise.then(() => done())
    })
  })
})

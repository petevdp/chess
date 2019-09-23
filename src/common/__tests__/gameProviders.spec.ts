import { GameUpdate } from '../types'
import { GameStream, GameClient, MoveMaker } from '../gameProviders'
import { of, from, EMPTY, NEVER } from 'rxjs'
import * as Engines from '../../bots/engines'
import { skip } from 'rxjs/operators'

const moveUpdates: GameUpdate[] = [
  {
    type: 'move',
    move: { from: 'a2', to: 'a4' }
  },
  {
    type: 'move',
    move: { from: 'a7', to: 'a5' }
  }
]

const resignUpdate = {
  type: 'end',
  end: {
    reason: 'resign',
    winnerId: 'player1'
  }
} as GameUpdate

describe('GameStream', () => {
  it('publishes updated ChessInstance on moves', done => {
    const stream = new GameStream(of(moveUpdates[0]))
    stream.move$.pipe(skip(1)).subscribe(chess => {
      expect(chess.history()[0]).toEqual('a4')
      done()
    })
  })

  it('maintains state between moves', done => {
    const stream = new GameStream(from(moveUpdates))
    const resultFEN = 'rnbqkbnr/1ppppppp/8/p7/P7/8/1PPPPPPP/RNBQKBNR w KQkq a6 0 2'
    stream.move$.pipe(skip(2)).subscribe(chess => {
      expect(chess.fen()).toEqual(resultFEN)
      done()
    })
  })

  it('broadcasts an endState', done => {
    const stream = new GameStream(of(resignUpdate))
    stream.end$.subscribe(endState => {
      expect(endState).toEqual(resignUpdate.end)
      done()
    })
  })

  it('allows custom starting positions', done => {
    const someFEN = 'rnbqkbnr/1ppppppp/8/p7/P7/8/1PPPPPPP/RNBQKBNR w KQkq a6 0 2'
    const stream = new GameStream(EMPTY, { startingFEN: someFEN })
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
        'b',

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
        'b',
        // movemaker will be ignored by updates, not part of class behaviour.
        // turning client moves into updates happens serverside
        mockMoveMaker
      )

      client.gameUpdate$.subscribe({
        complete: () => {
          expect(mockMoveMaker.mock.calls.length).toEqual(0)
          done()
        }
      })
    })

    it('calls moveMaker on instantiation when player is white', done => {
      const moveMaker: MoveMaker = chess => {
        return Engines.firstMoveEngine(chess)
      }
      const client = new GameClient(
        NEVER,
        'w',
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
        'w',
        Engines.firstMoveEngine
      )

      client.endPromise.then(() => done())
    })
  })
})

import { GameUpdate } from '../types'
import { GameStream, GameClient } from '../gameProviders'
import { of, from, EMPTY } from 'rxjs'
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

  it('allows custrom starting positions', done => {
    const someFEN = 'rnbqkbnr/1ppppppp/8/p7/P7/8/1PPPPPPP/RNBQKBNR w KQkq a6 0 2'
    const stream = new GameStream(EMPTY, { startingFEN: someFEN })
    stream.move$.subscribe(chess => {
      expect(chess.fen()).toEqual(someFEN)
      done()
    })
  })
})

describe('GameClient', () => {
  describe('calls to makeMove', () => {
    it('is called when opponent moves', done => {
      const mockMoveMaker = jest.fn(Engines.firstMoveEngine)
      const client = new GameClient(
        of(moveUpdates[0]),
        'b',

        // movemaker will be ignored by updates, not part of class behaviour.
        // turning client moves into updates happens serverside
        mockMoveMaker
      )

      client.generalUpdate$.subscribe({
        complete: () => {
          expect(mockMoveMaker.mock.calls.length).toEqual(1)
          done()
        }
      })
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

      client.generalUpdate$.subscribe({
        complete: () => {
          expect(mockMoveMaker.mock.calls.length).toEqual(0)
          done()
        }
      })
    })

    it('calls moveMaker on instantiation when player is white', done => {
      const mockMoveMaker = jest.fn(Engines.firstMoveEngine)
      const client = new GameClient(
        EMPTY,
        'w',

        // movemaker will be ignored by updates, not part of class behaviour.
        // turning client moves into updates happens serverside
        mockMoveMaker
      )

      client.clientMove$.subscribe({
        complete: () => {
          expect(mockMoveMaker.mock.calls.length).toEqual(1)
          done()
        }
      })
    })

    it('resolves endPromise with EndState when supplied', async (done) => {
      const client = new GameClient(
        of(resignUpdate),
        'w',
        () => { throw new Error('makeMove shouldn\'t be called') }
      )

      const endState = await client.endPromise
      expect(endState).toEqual(resignUpdate.end)
      done()
    })
  })
})

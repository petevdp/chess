import { GameUpdateWithId, CompleteGameInfo, UserDetails, PlayerDetails, GameUpdate } from '../types'
import { GameStream, GameClient, MoveMaker } from '../gameProviders'
import { of, from, EMPTY, NEVER } from 'rxjs'
import * as Engines from '../../bots/engines'
import { Chess, Move } from 'chess.js'
import { allGameInfo } from '../dummyData'
import { getMoveHistoryFromPgn, replayMoveHistory } from '../helpers'

const chess = new Chess()
const moveUpdates: GameUpdateWithId[] = [
  {
    type: 'move',
    move: chess.move('a4') as Move,
    id: 'game1'
  },
  {
    type: 'move',
    move: chess.move('a5') as Move,
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

const newGameInfo = (chess = new Chess()): CompleteGameInfo => ({
  id: 'game1',
  playerDetails: [
    player1, player2
  ],
  pgn: chess.pgn()
})

describe('GameStream', () => {
  it('publishes updated ChessInstance on moves', () => {
    const game = newGameInfo()
    const stream = new GameStream(of(moveUpdates[0]), game)

    expect(stream.state.chess.history()[0]).toEqual('a4')
  })

  it('maintains state between moves', () => {
    const game = newGameInfo()
    const stream = new GameStream(from(moveUpdates), game)
    const resultFEN = 'rnbqkbnr/1ppppppp/8/p7/P7/8/1PPPPPPP/RNBQKBNR w KQkq a6 0 2'
    expect(stream.state.chess.fen()).toEqual(resultFEN)
  })

  it('emits endStates', () => {
    const game = newGameInfo()
    const stream = new GameStream(of(resignUpdate), game)

    expect(stream.state.end).toEqual(resignUpdate.end)
  })

  it('can load games in progress', () => {
    const inputChess = new Chess()
    const stream = new GameStream(EMPTY, newGameInfo(inputChess))
    expect(stream.state.chess.fen()).toEqual(inputChess.fen())
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
        newGameInfo(),
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
        newGameInfo(),
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
        newGameInfo(),
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

    it('does not call moveMaker when there are no legal moves', done => {
      const mockMovemaker = jest.fn(Engines.firstMoveEngine)
      const game = allGameInfo.checkmateGame

      const client = new GameClient(EMPTY, game, game.playerDetails[1].user, mockMovemaker)

      client.action$.subscribe({
        complete: () => {
          expect(mockMovemaker).toBeCalledTimes(0)
          done()
        }
      })
    })

    it('does not attempt to respond to opponent moves that end the game', done => {
      const startingGameInfo = allGameInfo.checkmateGame
      const mockMoveMaker = jest.fn(Engines.firstMoveEngine)
      const startingMoveHistory = getMoveHistoryFromPgn(startingGameInfo.pgn)
      const moveHistory = startingMoveHistory.slice(0, -1)
      const endingMove = startingMoveHistory.reverse()[0]
      const game = replayMoveHistory(moveHistory)

      const preparedGameInfo: CompleteGameInfo = {
        ...startingGameInfo,
        pgn: game.pgn()
      }

      const endingMoveUpdate: GameUpdate = {
        type: 'move',
        move: endingMove
      }

      const client = new GameClient(
        of(endingMoveUpdate),
        preparedGameInfo,
        preparedGameInfo.playerDetails[1].user,
        mockMoveMaker
      )

      client.action$.subscribe({
        complete: () => {
          expect(mockMoveMaker).toBeCalledTimes(0)
          done()
        }
      })
    })
  })

  describe('endPromise', () => {
    it('ends when issued an gameUpdate of type end with reason resign', done => {
      const client = new GameClient(
        of(resignUpdate),
        newGameInfo(),
        user2,
        Engines.firstMoveEngine
      )

      client.endPromise.then(() => done())
    })
  })
})

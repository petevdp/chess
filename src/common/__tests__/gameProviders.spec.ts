import { GameUpdateWithId, GameInfo, UserDetails, PlayerDetails, GameUpdate } from '../types'
import { GameStream, GameClient, MoveMaker } from '../gameProviders'
import { of, from, EMPTY, NEVER, Subject } from 'rxjs'
import * as Engines from '../../bots/engines'
import { Chess, Move } from 'chess.js'
import { allGameInfo } from '../dummyData/dummyData'
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
  colour: 'w',
  elo: 1500
}

const user2: UserDetails = {
  id: 'u2',
  username: 'user2',
  type: 'bot'
}

const player2: PlayerDetails = {
  user: user2,
  colour: 'b',
  elo: 1500
}

const resignUpdate = {
  type: 'end',
  end: {
    reason: 'resign',
    winnerId: 'player1'
  }
} as GameUpdateWithId

const newGameInfo = (chess = new Chess()): GameInfo => ({
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

  describe('endPromise', () => {
    it('ends when issued an gameUpdate of type end with reason resign', async () => {
      const gameStream = new GameStream(
        of(resignUpdate),
        newGameInfo()
      )
      const endState = await gameStream.endPromise
      expect(endState.reason).toEqual('resign')
    })
  })
})

describe('GameClient', () => {
  describe('calls to getMove', () => {
    it('is called when opponent moves', (done) => {
      const whiteMove$ = new Subject<GameUpdate>()

      const mockMoveMaker = jest.fn(move => {
        done()
        whiteMove$.complete()
        return Engines.firstMoveEngine(move)
      })

      const client = new GameClient(
        new GameStream(whiteMove$, newGameInfo()),
        user2,
        mockMoveMaker
      )

      whiteMove$.next(moveUpdates[0])

      client.action$.subscribe(() => { })
    })

    it('does not output action when opponent has yet to move', done => {
      const mockMoveMaker = jest.fn(Engines.firstMoveEngine)
      const gameStream = new GameStream(EMPTY, newGameInfo())
      const client = new GameClient(
        gameStream,
        user2,
        mockMoveMaker
      )

      client.action$.subscribe({
        next: () => done.fail(new Error('no actions should be outputted')),
        complete: () => done()
      })
    })

    it('calls moveMaker on new game when player is white', done => {
      const moveMaker: MoveMaker = chess => {
        return Engines.firstMoveEngine(chess)
      }

      const client = new GameClient(
        new GameStream(NEVER, newGameInfo()),
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

    it('does not output actions when there are no legal moves', done => {
      const mockMovemaker = jest.fn(Engines.firstMoveEngine)
      const game = allGameInfo[1]

      const client = new GameClient(
        new GameStream(EMPTY, game),
        game.playerDetails[1].user,
        mockMovemaker
      )

      client.action$.subscribe({
        complete: () => {
          expect(mockMovemaker).toBeCalledTimes(0)
          done()
        }
      })
    })

    it('does not attempt to respond to opponent moves that end the game', done => {
      const startingGameInfo = allGameInfo[1]
      const mockMoveMaker = jest.fn(Engines.firstMoveEngine)
      const startingMoveHistory = getMoveHistoryFromPgn(startingGameInfo.pgn)
      const moveHistory = startingMoveHistory.slice(0, -1)
      const endingMove = startingMoveHistory.reverse()[0]
      const game = replayMoveHistory(moveHistory)

      const preparedGameInfo: GameInfo = {
        ...startingGameInfo,
        pgn: game.pgn()
      }

      const endingMoveUpdate: GameUpdate = {
        type: 'move',
        move: endingMove
      }

      const client = new GameClient(
        new GameStream(of(endingMoveUpdate), preparedGameInfo),
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
})

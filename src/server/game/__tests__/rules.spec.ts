import { allPlayerDetails, moves, allGameInfo } from "../../../common/dummyData/dummyData"
import { PlayerAction } from '../player'
import { Chess } from "chess.js"
import { getGameUpdatesFromPlayerAction } from "../rules"
import { GameUpdate } from "../../../common/types"
import { replayChessHistory } from "../testHelpers"

describe('getGameUpdatesFromPlayerAction', () => {
  it('returns a corresponding move update for valid moves', () => {
    const chess = new Chess()

    const playerDetails = allPlayerDetails.slice(0, 2)
    const action: PlayerAction = {
      type: 'move',
      move: moves[0],
      colour: moves[0].color,
      gameId: 'id',
      playerId: 'pid'
    }

    const updates = getGameUpdatesFromPlayerAction(action, chess, playerDetails)

    expect(updates).toEqual([{
      type: 'move',
      move: action.move
    } as GameUpdate])
  })

  it('returns a move update and an end update on game ending move', () => {
    const game = allGameInfo[1]
    const full = new Chess()
    full.load_pgn(game.pgn)
    const history = full.history({ verbose: true })
    const winningMove = history[history.length - 1]
    const rest = history.slice(0, -1)
    const mateInOne = replayChessHistory(rest)
    const winningPlayer = game.playerDetails[0].user.id

    const action: PlayerAction = {
      type: 'move',
      move: winningMove,
      colour: 'w',
      gameId: 'id',
      playerId: winningPlayer
    }
    const updates = getGameUpdatesFromPlayerAction(action, mateInOne, allPlayerDetails)

    expect(updates).toEqual([
      {
        type: 'move',
        move: winningMove
      },
      {
        type: 'end',
        end: {
          reason: 'checkmate',
          winnerId: winningPlayer
        }
      }
    ] as GameUpdate[])
  })

  it('throws an error if passed an invalid move', () => {
  })
})

import { allPlayerDetails, moves } from "../../../common/dummyData"
import { PlayerAction } from '../player'
import { Chess } from "chess.js"
import { getGameUpdatesFromPlayerAction } from "../rules"
import { GameUpdate } from "../../../common/types"

it('returns a corresponding move update', () => {
  const chess = new Chess()

  const action: PlayerAction = {
    type: 'move',
    move: moves[0],
    colour: 'w',
    gameId: 'id',
    playerId: 'pid'
  }

  const playerDetails = allPlayerDetails.slice(0, 2)
  const updates = getGameUpdatesFromPlayerAction(action, chess, playerDetails)

  expect(updates).toEqual([{
    type: 'move',
    move: action.move
  } as GameUpdate])
})

it('returns a move update and an end update on game ending move', () => {
})

import { ChessInstance, Move } from "chess.js"
import { DrawReason, Colour, GameUpdate, PlayerDetails } from "../../common/types"
import { PlayerAction } from "./__tests__/player"

function validateMove (move: Move, colour: Colour, chess: ChessInstance) {
  return (
    chess.turn() !== colour
      && chess.moves().includes(move.san)
  )
}

function validatePlayerAction ({ move, colour }: PlayerAction, chess: ChessInstance) {
  // TODO add more sophisticated validation for other player actions
  return !move || !validateMove(move, colour, chess)
}

function determineDrawType (chess: ChessInstance): DrawReason {
  // chess.js doesn't count stalemates as draws, but we do
  if (chess.in_stalemate()) {
    return 'in_stalemate'
  }
  if (!chess.in_draw()) {
    throw new Error('not in draw!')
  }

  if (chess.insufficient_material()) {
    return 'insufficient_material'
  }
  if (chess.in_threefold_repetition()) {
    return 'in_threefold_repetition'
  }
  return '50_move_rule'
}

/**
   * Input must be validated by validatePlayerAction first.
   *
   * Output is an array because we want to seperate game
   * endstates and the moves that ended them.
   */
export function getGameUpdatesFromPlayerAction (
  playerAction: PlayerAction,
  chess: ChessInstance,
  playerDetails: PlayerDetails[]
): GameUpdate[] {
  if (!validatePlayerAction(playerAction, chess)) {
    throw new Error('invalid player action')
  }

  const { type, playerId } = playerAction
  const updates = [] as GameUpdate[]
  const getOpponentId = () => {
    const player = playerDetails.find(p => p.user.id !== playerId)
    return player ? player.user.id : null
  }

  if (type === 'offerDraw') {
    updates.push({ type })
    return updates
  }

  if (type === 'resign') {
    updates.push({
      type: 'end',
      end: {
        winnerId: getOpponentId(),
        reason: 'resign'
      }
    })
    return updates
  }

  if (type === 'disconnect') {
    updates.push({
      type: 'end',
      end: {
        winnerId: getOpponentId(),
        reason: 'clientDisconnect'
      }
    })
    return updates
  }

  const move = playerAction.move

  if (!move) {
    throw new Error('malformed update: move is defined with type move')
  }

  const player = playerDetails.find(p => p.user.id === playerId)
  console.log(
      `move made by ${player && player.user.username}: ${
        move
      }`
  )
  console.log(chess.ascii())

  updates.push({ type: 'move', move })

  if (!chess.game_over()) {
    return updates
  }

  // game is over, so we need to include an endUpdate
  const endUpdate = {
    type: 'end'
  } as GameUpdate
  updates.push(endUpdate)

  if (chess.in_checkmate()) {
    endUpdate.end = {
      winnerId: playerId,
      reason: 'checkmate'
    }
    return updates
  }

  // TODO add flagging and alternative rulesets
  // must be draw
  endUpdate.end = {
    winnerId: null,
    reason: determineDrawType(chess)
  }

  return updates
}

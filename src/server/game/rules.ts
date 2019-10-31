import { ChessInstance, Move, Chess } from "chess.js"
import { DrawReason, Colour, GameUpdate, PlayerDetails } from "../../common/types"
import { PlayerAction } from "./player"

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

function duplicateGame (chess: ChessInstance) {
  if (chess.history().length === 0) {
    return new Chess()
  }
  const tmpChess = new Chess()
  const loaded = tmpChess.load_pgn(chess.pgn())
  if (!loaded) {
    throw new Error('bad pgn')
  }
  return tmpChess
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
  const { type, playerId } = playerAction

  if (!validatePlayerAction(playerAction, chess)) {
    console.log(playerAction.colour)
    const { move } = playerAction
    if (!move) {
      throw new Error(`move is undefined`)
    }

    console.log('details: ', playerDetails)
    const player = playerDetails.find(p => p.user.id === playerId)
    throw new Error(`
      invalid player action:
      ${player && player.user.username} (${player && player.colour})
      ${playerAction.move && playerAction.move.san}
      ${chess.ascii()}
      ${chess.history()}
    `)
  }

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

  const chessCopy = duplicateGame(chess)
  chessCopy.move(move)

  updates.push({ type: 'move', move })

  if (!chessCopy.game_over()) {
    return updates
  }

  // game is over, so we need to include an endUpdate
  const endUpdate = {
    type: 'end'
  } as GameUpdate
  updates.push(endUpdate)

  if (chessCopy.in_checkmate()) {
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
    reason: determineDrawType(chessCopy)
  }

  return updates
}

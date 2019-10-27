import { GameInfo } from "../common/types"
import { GameStateWithDetails } from "../common/gameProviders"
import { getChessConstructor } from "../common/helpers"

const Chess = getChessConstructor()

export function getGameStateWithDetailsFromGameInfo (info: GameInfo): GameStateWithDetails {
  const chess = new Chess()
  chess.load_pgn(info.pgn)
  return {
    chess,
    id: info.id,
    playerDetails: info.playerDetails,
    end: info.end
  }
}

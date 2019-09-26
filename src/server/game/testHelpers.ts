import { Observable, Subject } from "rxjs"
import { SocketClientMessage, GameUpdate, CompleteGameInfo, PlayerDetails } from "../../common/types"
import { MockClientConnection } from "../server/__mocks__/clientConnection"
import { Player } from "./player"
import { ClientConnection } from "../server/clientConnection"
import { Chess, Move } from "chess.js"
import { newClientMessage } from "../../common/dummyData"

export function getPlayerConnectionPair (
  clientMessage$: Observable<SocketClientMessage>,
  gameUpdate$: Observable<GameUpdate>,
  completeGameInfo: CompleteGameInfo,
  details: PlayerDetails
): [MockClientConnection, Player] {
  const clientConnection = new MockClientConnection(clientMessage$, details.user)

  // need to coerce mock into correct type to change connection constructor signature
  const player = new Player(
    clientConnection as unknown as ClientConnection,
    completeGameInfo,
    gameUpdate$,
    details.colour
  )
  return [clientConnection, player]
}

export function newChessInstance (pgn: string) {
  const chess = new Chess()
  chess.load_pgn(pgn)
  return chess
}

/*
* Simulates a game as messages on the provided subjects.
*/
export function simulatePlayerActions (
  pgn: string,
  gameId: string,
  white$: Subject<SocketClientMessage>,
  black$: Subject<SocketClientMessage>
) {
  const chess = new Chess()
  chess.load_pgn(pgn)

  chess.history({ verbose: true }).forEach(move => {
    const message = newClientMessage(move, gameId)
    move.color === 'w'
      ? white$.next(message)
      : black$.next(message)
  })
}

export function replayChessHistory (history: Move[]) {
  const chess = new Chess()
  history.forEach(move => chess.move(move))
  return chess
}

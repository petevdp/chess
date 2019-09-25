import { Observable } from "rxjs"
import { SocketClientMessage, UserDetails, CompleteGameInfo, GameUpdate, PlayerDetails } from "../../../common/types"
import { MockClientConnection } from "../../server/__mocks__/clientConnection"
import { LobbyMember } from "../lobbyMember"
import { ClientConnection } from "../../server/clientConnection"
import { Player } from "../player"

export function getLobbyMemberConnectionPair (
  clientMessage$: Observable<SocketClientMessage>,
  user: UserDetails
): [MockClientConnection, LobbyMember] {
  const clientConnection = new MockClientConnection(clientMessage$, user)

  // need to coerce mock into correct type to change connection constructor signature
  const member = new LobbyMember(clientConnection as unknown as ClientConnection)
  return [clientConnection, member]
}

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

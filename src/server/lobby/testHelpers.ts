import { Observable } from "rxjs"
import { SocketClientMessage, UserDetails } from "../../common/types"
import { MockClientConnection } from "../server/__mocks__/clientConnection"
import { LobbyMember } from "./lobbyMember"
import { ClientConnection } from "../server/clientConnection"

export function getLobbyMemberConnectionPair (
  clientMessage$: Observable<SocketClientMessage>,
  user: UserDetails
): [MockClientConnection, LobbyMember] {
  const clientConnection = new MockClientConnection(clientMessage$, user)

  // need to coerce mock into correct type to change connection constructor signature
  const member = new LobbyMember(clientConnection as unknown as ClientConnection)
  return [clientConnection, member]
}

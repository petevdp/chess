import { MockClientConnection }  from '../__mocks__/clientConnection';
import { ClientConnection } from '../clientConnection';
import { UserDetails, LobbyMemberDetails, SocketServerMessage, SocketClientMessage } from '../../../common/types';
import { LobbyMember } from '../../lobby/lobbyMember';
import { empty, EMPTY, of, NEVER, Observable } from 'rxjs';


const user1 = {
  id: 'id1',
  username: 'user1',
  type: 'human',
} as UserDetails;

const lobbyMember1 = {
  ...user1,
  currentGame: null,
  leftLobby: false,
} as LobbyMemberDetails

beforeEach(() => {
})

afterEach(() => {
})

function getLobbyConnectionPair(
  clientMessage$: Observable<SocketClientMessage>
): [MockClientConnection, LobbyMember] {
  const clientConnection = new MockClientConnection(clientMessage$);

  // need to coerce mock into correct type to change connection constructor signature
  const member = new LobbyMember(clientConnection as unknown as ClientConnection)
  return [clientConnection, member];
}

it('can update member details', () => {
  const [clientConnection, member] = getLobbyConnectionPair(EMPTY);


  const update = new Map<string, LobbyMemberDetails>([
    [lobbyMember1.id, lobbyMember1],
  ])
  member.updateLobbyMemberDetails(update)

  const message = {
    member: {
      memberUpdate: [...update]
    }
  } as SocketServerMessage;

  expect(clientConnection.sendMessage.mock.calls[0][0]).toEqual(message)
  clientConnection.clean();
});

describe('state', () => {
  it('set leftLobby to true when clientMessage$ completes', () => {
  const [clientConnection, member] = getLobbyConnectionPair(EMPTY);
    expect(member.state.leftLobby).toBeTruthy();
    clientConnection.clean();
  })

  test('leftLobby is true when client observable still open', () => {
  const [clientConnection, member] = getLobbyConnectionPair(NEVER);
    expect(member.state.leftLobby).toBeFalsy();
    clientConnection.clean();
  });
})

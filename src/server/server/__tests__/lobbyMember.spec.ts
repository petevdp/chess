import { MockClientConnection }  from '../__mocks__/clientConnection';
import { ClientConnection } from '../clientConnection';
import { UserDetails, LobbyMemberDetails, SocketServerMessage } from '../../../common/types';
import { LobbyMember } from '../../lobby/lobbyMember';
import { empty, EMPTY } from 'rxjs';


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

it('can update member details', () => {
  const clientConnection = new MockClientConnection(EMPTY);

  // need to coerce mock into type to change connection constructor signature
  const member = new LobbyMember(clientConnection as unknown as ClientConnection)
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

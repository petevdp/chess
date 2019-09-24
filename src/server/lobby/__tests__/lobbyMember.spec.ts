import { UserDetails, LobbyMemberDetails, SocketServerMessage } from '../../../common/types'
import { EMPTY, NEVER } from 'rxjs'
import { getLobbyConnectionPair } from './helpers'

const user1 = {
  id: 'id1',
  username: 'user1',
  type: 'human'
} as UserDetails

const lobbyMember1 = {
  ...user1,
  currentGame: null,
  leftLobby: false
} as LobbyMemberDetails

beforeEach(() => {
})

afterEach(() => {
})

it('can update member details', () => {
  const [clientConnection, member] = getLobbyConnectionPair(EMPTY, user1)

  const update = new Map<string, LobbyMemberDetails>([
    [lobbyMember1.id, lobbyMember1]
  ])
  member.updateLobbyMemberDetails(update)

  const message = {
    member: {
      memberUpdate: [...update]
    }
  } as SocketServerMessage

  expect(clientConnection.sendMessage.mock.calls[0][0]).toEqual(message)
  clientConnection.clean()
})

describe('state', () => {
  it('set leftLobby to true when clientMessage$ completes', () => {
    const [clientConnection, member] = getLobbyConnectionPair(EMPTY, user1)
    expect(member.state.leftLobby).toBeTruthy()
    clientConnection.clean()
  })

  test('leftLobby is true when client observable still open', () => {
    const [clientConnection, member] = getLobbyConnectionPair(NEVER, user1)
    expect(member.state.leftLobby).toBeFalsy()
    clientConnection.clean()
  })
})

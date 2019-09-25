import { UserDetails, LobbyMemberDetails, SocketServerMessage, SocketClientMessage } from '../../../common/types'
import { EMPTY, NEVER, Subject } from 'rxjs'
import { getLobbyMemberConnectionPair } from './helpers'
import { skip } from 'rxjs/operators'

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
  const [clientConnection, member] = getLobbyMemberConnectionPair(EMPTY, user1)

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
  it('is set to the correct values on instantiation', () => {
    const [, member] = getLobbyMemberConnectionPair(NEVER, user1)
    expect(member.state).toEqual({currentGame: null, leftLobby: false})
  })

  it('set leftLobby to true when clientMessage$ completes', () => {
    const [clientConnection, member] = getLobbyMemberConnectionPair(EMPTY, user1)
    expect(member.state.leftLobby).toBeTruthy()
    clientConnection.clean()
  })

  test('leftLobby is true when client observable still open', () => {
    const [clientConnection, member] = getLobbyMemberConnectionPair(NEVER, user1)
    expect(member.state.leftLobby).toBeFalsy()
    clientConnection.clean()
  })
})

describe('updates', () => {
  it('broadcasts update when state is updated', done => {
    const subject = new Subject<SocketClientMessage>()
    const [, member] = getLobbyMemberConnectionPair(subject, user1)

    member.update$.subscribe({
      next: () => {
        done()
        subject.complete()
      }
    })
    member.joinGame('game')
  })

  it('broadcasts null update when user leaves, and then completes', done => {
    const subject = new Subject<SocketClientMessage>()
    const [, member] = getLobbyMemberConnectionPair(subject, user1)

    member.update$.pipe(skip(1)).subscribe({
      next: update => {
        expect(update).toBeNull()
      },
      complete: () => done()
    })
    subject.complete()
  })
})

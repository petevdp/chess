import { UserDetails, LobbyMemberDetails, SocketServerMessage, SocketClientMessage } from '../../../common/types'
import { EMPTY, NEVER, Subject } from 'rxjs'
import { getLobbyMemberConnectionPair } from '../testHelpers'
import { skip } from 'rxjs/operators'
import { allGameInfo, displayMessages } from '../../../common/dummyData'

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

describe('initial client messages', () => {
  it('sends a display message containing the given activeGames', () => {
    const [conn] = getLobbyMemberConnectionPair(EMPTY, user1, [allGameInfo.newGame])
    expect(conn.sendMessage).toHaveBeenCalledWith({
      game: {
        type: 'display',
        display: [allGameInfo.newGame]
      }
    } as SocketServerMessage)
  })
})
describe('broadcasting', () => {
  it('can broadcast member details', () => {
    const [clientConnection, member] = getLobbyMemberConnectionPair(EMPTY, user1)

    const update = new Map<string, LobbyMemberDetails>([
      [lobbyMember1.id, lobbyMember1]
    ])
    member.broadcastLobbyMemberDetails([...update])

    const message = {
      member: {
        memberDetailsUpdate: [...update]
      }
    } as SocketServerMessage

    console.log('mock calls', clientConnection.sendMessage.mock.calls)

    expect(clientConnection.sendMessage).toHaveBeenCalledWith(message)
    clientConnection.clean()
  })

  it('can broadcast GameMessages', () => {
    const [conn, member] = getLobbyMemberConnectionPair(EMPTY, user1)
    const message = displayMessages[0]
    member.broadcastActiveGameMessage(message)

    expect(conn.sendMessage).toHaveBeenCalledWith({
      game: message
    })
    conn.clean()
  })
})

describe('state', () => {
  it('is set to the correct values on instantiation', () => {
    const [, member] = getLobbyMemberConnectionPair(NEVER, user1)
    expect(member.state).toEqual({ currentGame: null, leftLobby: false })
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

describe('update$', () => {
  it('emits update when state is updated', done => {
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

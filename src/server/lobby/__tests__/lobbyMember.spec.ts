import { UserDetails, LobbyMemberDetails, SocketServerMessage, SocketClientMessage, EndState } from '../../../common/types'
import { EMPTY, NEVER, Subject } from 'rxjs'
import { getLobbyMemberConnectionPair } from '../testHelpers'
import { toArray, map, takeWhile } from 'rxjs/operators'
import { displayedGameMessages } from '../../../common/dummyData/dummyData'
import { MemberState } from '../lobbyMember'

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

describe('broadcasting', () => {
  it('can broadcast member details', () => {
    const [clientConnection, member] = getLobbyMemberConnectionPair(EMPTY, user1)

    const update = new Map<string, LobbyMemberDetails>([
      [lobbyMember1.id, lobbyMember1]
    ])
    member.broadcastLobbyMemberDetailsUpdate([...update])

    const message: SocketServerMessage = {
      lobby: {
        member: {
          memberDetailsUpdate: [...update]
        }
      }
    }

    console.log('mock calls', clientConnection.sendMessage.mock.calls)

    expect(clientConnection.sendMessage).toHaveBeenCalledWith(message)
    clientConnection.clean()
  })

  it('can broadcast GameMessages', () => {
    const [conn, member] = getLobbyMemberConnectionPair(EMPTY, user1)
    const message = displayedGameMessages[0]
    member.broadcastDisplayedGameMessage(message)

    expect(conn.sendMessage).toHaveBeenCalledWith({
      lobby: {
        displayedGame: message
      }
    } as SocketServerMessage)
    conn.clean()
  })
})

describe('state', () => {
  it('is set to the correct values on instantiation', () => {
    const [, member] = getLobbyMemberConnectionPair(NEVER, user1)
    expect(member.state).toEqual({ currentGame: null, leftLobby: false, gameHistory: [] })
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

  it('doesn\'t emit twice', (done) => {
    const subject = new Subject<SocketClientMessage>()
    const [, member] = getLobbyMemberConnectionPair(subject, user1)
    member.update$.pipe(
      takeWhile(member => member !== null),
      toArray()
    ).subscribe(arr => {
      expect(arr).toHaveLength(1)
      done()
    })
    subject.complete()
  })
})

describe('joinGame', () => {
  const [, member] = getLobbyMemberConnectionPair(NEVER, user1)
  const gameId = 'id'
  // const end$: ConnectableObservable<EndState> = rxOf<EndState>()
  const end$ = new Subject<EndState>()
  const checkmate: EndState = {
    reason: 'checkmate',
    winnerId: 'id'
  }

  const out = member.joinGame(gameId, end$.toPromise())
  it('sets currentGame back to null once the endPromise is resolved', async () => {
    expect(member.state.currentGame).toEqual(gameId)

    end$.next(checkmate)
    end$.complete()
    await out
    expect(member.state.currentGame).toBeNull()
  })

  it('adds a game to the games history once the endPromise is resolved', async () => {
    end$.next(checkmate)
    await out
    expect(member.state.gameHistory).toContain(gameId)
    end$.complete()
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
    member.joinGame('game', EMPTY.toPromise())
  })

  it('broadcasts null update when user leaves, and then completes', done => {
    const subject = new Subject<SocketClientMessage>()
    const [, member] = getLobbyMemberConnectionPair(subject, user1)

    member.update$.pipe(
      map(member => (member ? { ...member.state } : null)),
      toArray()
    ).subscribe({
      next: (arr) => {
        expect(arr).toHaveLength(2)
        const first = arr[0] as MemberState
        expect(first.leftLobby).toBeFalsy()
        expect(arr[1]).toBeNull()
        done()
      }
    })
    subject.complete()
  })
})

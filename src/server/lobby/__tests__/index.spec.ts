import { userDetails } from '../../../common/dummyData'
import { Subject, NEVER } from 'rxjs'
import { Lobby } from '../index'
import { MockClientConnection } from '../../server/__mocks__/clientConnection'
import { ClientConnection } from '../../server/clientConnection'
import { SocketClientMessage, SocketServerMessage } from '../../../common/types'
import { last, skip, toArray, takeWhile } from 'rxjs/operators'
import Game from '../../game'
// import { last } from 'rxjs/operators'

describe('memberDetailsMap$', () => {
  it('updates memberDetailsMap$ with new entry when one is added', () => {
    const subject = new Subject<SocketClientMessage>()
    const user = userDetails[0]
    const mockConnection = new MockClientConnection(subject, user)

    const lobby = new Lobby()

    lobby.addLobbyMember(mockConnection as unknown as ClientConnection)
    expect(lobby.memberDetailsMap.has(user.id)).toBeTruthy()
    lobby.complete()
    subject.complete()
  })
})

describe('member details connection updates', () => {
  it('sends all details on connection', () => {
    const s1 = new Subject<SocketClientMessage>()
    const user1 = userDetails[0]
    const mockConnection1 = new MockClientConnection(s1, user1)

    const s2 = new Subject<SocketClientMessage>()
    const user2 = userDetails[1]
    const mockConnection2 = new MockClientConnection(s2, user2)

    const lobby = new Lobby()

    lobby.addLobbyMember(mockConnection1 as unknown as ClientConnection)
    lobby.addLobbyMember(mockConnection2 as unknown as ClientConnection)

    const message: SocketServerMessage = {
      lobby: {
        member: {
          memberDetailsUpdate: [...lobby.memberDetailsMap]
        }
      }
    }

    expect(mockConnection2.sendMessage).toHaveBeenCalledWith(message)

    lobby.complete()
    s1.complete()
    s2.complete()
  })

  it('sends only new details after first update', done => {
    const s1 = new Subject<SocketClientMessage>()
    const user1 = userDetails[0]
    const mockConnection1 = new MockClientConnection(s1, user1)

    const s2 = new Subject<SocketClientMessage>()
    const user2 = userDetails[1]
    const mockConnection2 = new MockClientConnection(s2, user2)

    const s3 = new Subject<SocketClientMessage>()
    const user3 = userDetails[2]
    const mockConnection3 = new MockClientConnection(s3, user3)

    const lobby = new Lobby()

    lobby.addLobbyMember(mockConnection1 as unknown as ClientConnection)
    lobby.addLobbyMember(mockConnection2 as unknown as ClientConnection)

    lobby.memberDetailsUpdates$.pipe(last()).subscribe((update) => {
      const message: SocketServerMessage = {
        lobby: {
          member: {
            memberDetailsUpdate: [update]
          }
        }
      }
      expect(mockConnection2.sendMessage).toHaveBeenLastCalledWith(message)
      done()
    })

    lobby.addLobbyMember(mockConnection3 as unknown as ClientConnection)

    lobby.complete()
    s1.complete()
    s2.complete()
    s3.complete()
  })
})

describe('displayedGameMessage$', () => {
  const user1 = userDetails[0]
  const user2 = userDetails[1]

  const mockConnection1 = new MockClientConnection(NEVER, user1)
  const mockConnection2 = new MockClientConnection(NEVER, user2)

  let lobby: Lobby

  beforeEach(() => {
    lobby = new Lobby()
  })

  afterEach(() => {
    mockConnection2.clean()
    mockConnection1.clean()
    lobby.complete()
  })

  it('emits DisplayGameMessage.add whenever a game is created', (done) => {
    lobby.displayedGameMessage$.subscribe(msg => {
      expect(msg.add).toHaveLength(1)
      done()
    })

    lobby.addLobbyMember(mockConnection1 as unknown as ClientConnection)
    lobby.addLobbyMember(mockConnection2 as unknown as ClientConnection)

    lobby.complete()
  })

  it('emits any updates to the game', done => {
    const l = lobby as any

    l.arena.games$.subscribe((game: Game) => {
      console.log('new game in test')
      game.gameUpdate$.subscribe((msg) => console.log('gameUpdate: ', msg))
      game.end()
      game.endPromise.then(() => console.log('endpromise resolved'))
    })

    lobby.displayedGameMessage$.pipe(skip(1)).subscribe({
      next: msg => {
        expect(msg).toHaveProperty('update')
        done()
      },
      complete: () => console.log('completed for some reason')
    })

    lobby.addLobbyMember(mockConnection1 as unknown as ClientConnection)
    lobby.addLobbyMember(mockConnection2 as unknown as ClientConnection)

    lobby.complete()
  })

  it('emits a given update only once', done => {
    lobby.displayedGameMessage$.pipe(
      toArray()
    ).subscribe(arr => {
      console.log('arr: ', arr)
      console.log('len: ', arr.length)

      expect(arr).toHaveLength(2)
      done()
    })

    const l = lobby as any

    l.arena.games$.subscribe((game: Game) => {
      game.end()
    })

    lobby.addLobbyMember(mockConnection1 as unknown as ClientConnection)
    lobby.addLobbyMember(mockConnection2 as unknown as ClientConnection)
    lobby.complete()
  })
})

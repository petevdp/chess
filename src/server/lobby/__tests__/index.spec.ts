import { allUserDetails } from '../../../common/dummyData/dummyData'
import { Subject, NEVER } from 'rxjs'
import { Lobby } from '../index'
import { MockClientConnection } from '../../server/__mocks__/clientConnection'
import { ClientConnection } from '../../server/clientConnection'
import { SocketClientMessage, SocketServerMessage } from '../../../common/types'
import { last, skip, first } from 'rxjs/operators'
import Game from '../../game'
import DBQueries, { DBQueriesInterface } from '../../db/queries'
jest.mock('../../db/queries')

let dbQueries: DBQueriesInterface
let lobby: Lobby

beforeEach(() => {
  dbQueries = new DBQueries()
  lobby = new Lobby(dbQueries)
})

afterEach(() => {
  lobby.complete()
})

describe('memberDetailsMap$', () => {
  it('updates memberDetailsMap$ with new entry when one is added', () => {
    const subject = new Subject<SocketClientMessage>()
    const user = allUserDetails[0]
    const mockConnection = new MockClientConnection(subject, user)

    lobby.addLobbyMember(mockConnection as unknown as ClientConnection)
    expect(lobby.memberDetailsMap.has(user.id)).toBeTruthy()
    lobby.complete()
    subject.complete()
  })
})

describe('member details connection updates', () => {
  it('sends all details on connection', () => {
    const s1 = new Subject<SocketClientMessage>()
    const user1 = allUserDetails[0]
    const mockConnection1 = new MockClientConnection(s1, user1)

    const s2 = new Subject<SocketClientMessage>()
    const user2 = allUserDetails[1]
    const mockConnection2 = new MockClientConnection(s2, user2)

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

  it('sends only new details after first update for each member', done => {
    const s1 = new Subject<SocketClientMessage>()
    const user1 = allUserDetails[0]
    const mockConnection1 = new MockClientConnection(s1, user1)

    const s2 = new Subject<SocketClientMessage>()
    const user2 = allUserDetails[1]
    const mockConnection2 = new MockClientConnection(s2, user2)

    const s3 = new Subject<SocketClientMessage>()
    const user3 = allUserDetails[2]
    const mockConnection3 = new MockClientConnection(s3, user3)

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
  const user1 = allUserDetails[0]
  const user2 = allUserDetails[1]

  const mockConnection1 = new MockClientConnection(NEVER, user1)
  const mockConnection2 = new MockClientConnection(NEVER, user2)

  afterEach(() => {
    mockConnection2.clean()
    mockConnection1.clean()
    lobby.complete()
  })

  it('emits DisplayGameMessage.add whenever a game is created', (done) => {
    lobby.displayedGameMessage$.pipe(first()).subscribe(msg => {
      expect(msg.add).toHaveLength(1)
      done()
    })

    lobby.addLobbyMember(mockConnection1 as unknown as ClientConnection)
    lobby.addLobbyMember(mockConnection2 as unknown as ClientConnection)
  })

  // this test is broken.. we get the correct property but won't complete
  it.skip('emits any updates to the game being displayed', async () => {
    const l = lobby as any

    l.arena.games$.pipe(first()).subscribe((game: Game) => {
      game.gameUpdate$.subscribe((msg) => console.log('gameUpdate: ', msg))
      game.endPromise.then(() => console.log('endpromise resolved'))
      game.end()
    })

    lobby.addLobbyMember(mockConnection1 as unknown as ClientConnection)
    lobby.addLobbyMember(mockConnection2 as unknown as ClientConnection)

    const msg = await lobby.displayedGameMessage$.pipe(skip(2), first()).toPromise()
    console.log('msg: ', msg)
    expect(msg).toHaveProperty('update')
  })
})

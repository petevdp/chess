import { MockSocketService } from '../__mocks__/socket.service'
import { LobbyService } from '../lobby.service'
import { SocketService } from '../socket.service'
import { allMemberServerMessages, allMemberDetailsUpdates, gameUpdateMessage, joinMessage } from '../../../common/dummyData'
import { takeLast, first } from 'rxjs/operators'
import { SocketServerMessage } from '../../../common/types'

let mockSocketService: MockSocketService

beforeEach(() => {
  mockSocketService = new MockSocketService()
})

afterEach(() => {
  mockSocketService.serverMessage$.complete()
})

describe('lobbyMemberDetailsMap', () => {
  it('updates lobbymemberDetailsMap on lobbymember message', done => {
    const service = new LobbyService(mockSocketService as unknown as SocketService)

    service.lobbyMemberDetailsMap$.subscribe(detailsMap => {
      expect([...detailsMap][0]).toEqual(allMemberDetailsUpdates[0])
      done()
    })
    mockSocketService.serverMessage$.next(allMemberServerMessages[0])
  })
})

describe('gameStreamMap', () => {
  it('creates a gameStreamService when a new game comes in', done => {
    const service = new LobbyService(mockSocketService as unknown as SocketService)
    const gameJoinMessage: SocketServerMessage = {
      game: joinMessage
    }
    const msg = joinMessage as any
    const id = msg.join.id
    service.gameStreamMap$.subscribe(mapUpdate => { console.log('mapUpdate: ', [...mapUpdate]) })

    service.gameStreamMap$.pipe(first()).subscribe(gameStreamMap => {
      expect(gameStreamMap.get(id)).toBeTruthy()
      done()
    })

    mockSocketService.serverMessage$.next(gameJoinMessage)
  })
})

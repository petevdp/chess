import { MockSocketService } from '../__mocks__/socket.service'
import { LobbyService } from '../lobby.service'
import { SocketService } from '../socket.service'
import { allMemberServerMessages, allMemberDetailsUpdates, displayMessages } from '../../../common/dummyData'
import { SocketServerMessage } from '../../../common/types'
import { skip } from 'rxjs/operators'

let mockSocketService: MockSocketService
let lobbyService: LobbyService

beforeEach(() => {
  mockSocketService = new MockSocketService()
  lobbyService = new LobbyService(mockSocketService as unknown as SocketService)
})

afterEach(() => {
  mockSocketService.serverMessage$.complete()
})

describe('lobbyMemberDetailsMap', () => {
  it('updates lobbymemberDetailsMap on lobbymember message', done => {
    lobbyService.lobbyMemberDetailsMap$.subscribe(detailsMap => {
      expect([...detailsMap][0]).toEqual(allMemberDetailsUpdates[0])
      done()
    })
    mockSocketService.serverMessage$.next(allMemberServerMessages[0])
  })
})

describe('streamedGameStateMap$', () => {
  const displayMessage1: SocketServerMessage = {
    game: displayMessages[0]
  }

  const displayMessage2: SocketServerMessage = {
    game: displayMessages[1]
  }

  const dispMsg = displayMessages[0] as any
  const game1Id = dispMsg.display[0].id

  const endMessage: SocketServerMessage = {
    game: {
      type: 'update',
      update: {
        type: 'end',
        id: game1Id
      }
    }
  }

  it('emits an array of length 1 when it receives a display command with one game', done => {
    lobbyService.streamedGameStateMap$.subscribe(stateMap => {
      expect(stateMap.size).toEqual(1)
      done()
    })
    mockSocketService.serverMessage$.next(displayMessage1)
  })

  it('does not emit ended gameStates on the next iteration', done => {
    lobbyService.streamedGameStateMap$.pipe(skip(2)).subscribe(stateMap => {
      expect(!stateMap.has(game1Id)).toBeFalsy()
      done()
    })
    mockSocketService.serverMessage$.next(displayMessage1)
    mockSocketService.serverMessage$.next(endMessage)
    mockSocketService.serverMessage$.next(displayMessage2)
  })

  it('does not duplicate games if it recieves the same game twice', done => {
    lobbyService.streamedGameStateMap$.pipe(skip(1)).subscribe(stateMap => {
      expect(stateMap.size).toEqual(1)
      done()
    })
    mockSocketService.serverMessage$.next(displayMessage1)
    mockSocketService.serverMessage$.next(displayMessage1)
  })
})

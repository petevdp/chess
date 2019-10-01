import { MockSocketService } from '../__mocks__/socket.service'
import { LobbyService } from '../lobby.service'
import { SocketService } from '../socket.service'
import { allMemberServerMessages, allMemberDetailsUpdates, displayedGameMessages } from '../../../common/dummyData'
import { SocketServerMessage } from '../../../common/types'

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

describe('displayedGameMessage$', () => {
  const displayServerMessage1: SocketServerMessage = {
    lobby: {
      displayedGame: displayedGameMessages[0]
    }
  }

  const displayServerMessage2: SocketServerMessage = {
    lobby: {
      displayedGame: displayedGameMessages[1]
    }
  }

  const dispMsg = displayedGameMessages[0] as any
  const game1Id: string = dispMsg.add[0].id

  const endServerMessage: SocketServerMessage = {
    lobby: {
      displayedGame: {
        type: 'update',
        update: {
          type: 'end',
          id: game1Id,
          end: {
            reason: 'resign',
            winnerId: 'lmao'
          }
        }
      }
    }
  }

  it('includes state of games given by a display message', () => {
    mockSocketService.serverMessage$.next(displayServerMessage1)
    expect(lobbyService.streamedGameStateArr.find(({ id }) => id === game1Id)).toBeTruthy()
  })

  it('does not emit ended gameStates on the next iteration', () => {
    mockSocketService.serverMessage$.next(displayServerMessage1)
    mockSocketService.serverMessage$.next(endServerMessage)
    mockSocketService.serverMessage$.next(displayServerMessage2)
    console.log('ids: ', lobbyService.streamedGameStateIdArr)
    expect(lobbyService.streamedGameStateIdArr.includes(game1Id)).toBeFalsy()
  })

  it('does not duplicate games if it recieves the same game twice', () => {
    mockSocketService.serverMessage$.next(displayServerMessage1)
    mockSocketService.serverMessage$.next(displayServerMessage1)
    expect(lobbyService.streamedGameStateArr.length).toEqual(1)
  })
})

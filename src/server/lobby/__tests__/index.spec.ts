import { userDetails } from '../../../common/dummyData'
import { Subject } from 'rxjs'
import { Lobby } from '../index'
import { MockClientConnection } from '../../server/__mocks__/clientConnection'
import { ClientConnection } from '../../server/clientConnection'
import { SocketClientMessage } from '../../../common/types'

describe('userDetails$', () => {
  it('updates memberDetails$ with new entry when one is added', done => {
    const subject = new Subject<SocketClientMessage>()
    const user = userDetails[0]
    const mockConnection = new MockClientConnection(subject, user)

    const lobby = new Lobby()

    lobby.memberDetails$.subscribe(map => {
      expect([...map.values()][0].username).toEqual(user.username)
      done()
      subject.complete()
    })

    lobby.addLobbyMember(mockConnection as unknown as ClientConnection)
  })
})

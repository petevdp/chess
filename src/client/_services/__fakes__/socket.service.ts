import { Subject, from } from 'rxjs'
import { SocketServerMessage, SocketClientMessage } from '../../../common/types'
import { allMemberDetails, makeFakeGames } from '../../../common/dummyData/dummyData'
import { SocketServiceInterface } from '../socket.service'

const fakeMessages: SocketServerMessage[] = [
  {
    lobby: {
      member: {
        memberDetailsUpdate: allMemberDetails.map(d => [d.id, d])
      }
    }
  },
  {
    lobby: {
      displayedGame: {
        type: 'add',
        add: makeFakeGames(10)
      }
    }
  }
]

class FakeSocketService implements SocketServiceInterface {
  clientMessageSubject = new Subject<SocketClientMessage>();
  serverMessage$ = from(fakeMessages)

  complete () {
    this.clientMessageSubject.complete()
  }

  useSocketStatus () {
    return true
  }
}

export default FakeSocketService

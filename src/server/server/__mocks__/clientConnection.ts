import { SocketClientMessage } from '../../../common/types'
import { Observable } from 'rxjs'

export class MockClientConnection {
  constructor (public clientMessage$: Observable<SocketClientMessage>) { }
  sendMessage = jest.fn();
  complete = jest.fn();
  isActive = true;

  clean () {
    this.sendMessage.mockClear()
    this.complete.mockClear()
  }
}

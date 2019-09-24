import { SocketClientMessage, UserDetails } from '../../../common/types'
import { Observable } from 'rxjs'
import { ClientConnectionInterface } from '../clientConnection'

export class MockClientConnection implements ClientConnectionInterface {
  constructor (
    public clientMessage$: Observable<SocketClientMessage>,
    public user: UserDetails
  ) { }

  sendMessage = jest.fn();
  complete = jest.fn();
  isActive = true;

  clean () {
    this.sendMessage.mockClear()
    this.complete.mockClear()
  }
}

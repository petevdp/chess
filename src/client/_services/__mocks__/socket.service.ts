import { SocketServerMessage } from "../../../common/types"
import { Subject } from "rxjs"

export class MockSocketService {
  serverMessage$ = new Subject<SocketServerMessage>()
  sendMessageToServer = jest.fn()
  constructor () {}
}

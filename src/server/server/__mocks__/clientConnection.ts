import { SocketClientMessage, SocketServerMessage } from "../../../common/types";
import { Subject, Observable } from "rxjs";
import { ClientConnection } from "../clientConnection";

export class MockClientConnection {
  constructor(public clientMessage$: Observable<SocketClientMessage>) { }
  sendMessage = jest.fn();
  complete = jest.fn();
  isActive = true;

  clean() {
    this.sendMessage.mockClear();
    this.complete.mockClear()
  }
}

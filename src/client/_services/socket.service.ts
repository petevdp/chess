import { BehaviorSubject, Observable, Subject } from 'rxjs'
import { SocketServerMessage, SocketClientMessage } from '../../common/types'
import { useObservable } from 'rxjs-hooks'
import { SOCKET_URL_CLIENT } from '../../common/config'

export interface SocketServiceInterface {
  serverMessage$: Observable<SocketServerMessage>;
  useSocketStatus: () => boolean;
  complete: () => void;
}

export class SocketService implements SocketServiceInterface {
  serverMessage$: Observable<SocketServerMessage>;
  private serverMessageSubject: BehaviorSubject<SocketServerMessage>;
  private socket: WebSocket
  private clientMessage$ = new Subject<SocketClientMessage>();

  constructor () {
    // not assigning socket till init
    console.log('socket update!')
    this.serverMessageSubject = new BehaviorSubject({})
    this.serverMessage$ = this.serverMessageSubject.asObservable()

    // TODO: if this connection fails, we need to handle it gracefully
    this.socket = new WebSocket(SOCKET_URL_CLIENT)

    this.socket.onmessage = event => {
      const message = JSON.parse(event.data) as SocketServerMessage
      this.serverMessageSubject.next(message)
    }
  }

  useSocketStatus () {
    const connected = useObservable(() => new Observable<boolean>(subscriber => {
      this.socket.onopen = () => subscriber.next(true)
      this.socket.onclose = (event) => {
        console.log('socket disconnected: ', event.reason)
        subscriber.next(false)
      }
    }), this.socket.readyState === WebSocket.OPEN)
    return connected
  }

  complete () {
    this.socket.close()
  }
}

import { Observable } from 'rxjs'
import { SocketClientMessage, SocketServerMessage, UserDetails } from '../../common/types'
import WebSocket from 'ws'
import { share } from 'rxjs/operators'

export interface ClientConnectionInterface {
  clientMessage$: Observable<SocketClientMessage>;
  sendMessage: (socketServerMessage: SocketServerMessage) => void;
  isActive: boolean;
  user: UserDetails;
  complete: () => void;
}

export class ClientConnection implements ClientConnectionInterface {
  clientMessage$: Observable<SocketClientMessage>;

  constructor (private ws: WebSocket, public user: UserDetails) {
    console.log('new connection!: ', user.username)

    this.clientMessage$ = new Observable<SocketClientMessage>(subscriber => {
      ws
        .on('message', msg => subscriber.next(JSON.parse(msg as string) as SocketClientMessage))
        .on('error', () => {
          console.log('completed socket message$')
          subscriber.complete()
        })
        .on('close', () => {
          console.log(`${user.username} disconnected`)
          subscriber.complete()
        })
    }).pipe(share())
  }

  get isActive () {
    return this.ws.readyState === this.ws.OPEN
  }

  sendMessage (message: SocketServerMessage) {
    if (!this.isActive) {
      return
    }
    this.ws.send(JSON.stringify(message))
  }

  complete () {
    this.ws.close()
  }
}

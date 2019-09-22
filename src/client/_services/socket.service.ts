import IOClient from 'socket.io-client'
import { BehaviorSubject, Observable, Subject } from 'rxjs'
import { SocketServerMessage, SocketClientMessage } from '../../common/types'

import { useObservable } from 'rxjs-hooks'

export class SocketService {
  serverMessage$: Observable<SocketServerMessage>;
  private serverMessageSubject: BehaviorSubject<SocketServerMessage>;
  private socket: SocketIOClient.Socket;

  clientMessageSubject = new Subject<SocketClientMessage>();

  constructor () {
    // not assigning socket till init
    console.log('socket update!')
    this.serverMessageSubject = new BehaviorSubject({})
    this.serverMessage$ = this.serverMessageSubject.asObservable()

    // TODO: if this connection fails, we need to handle it gracefully
    this.socket = IOClient('http://localhost:3000')

    this.socket.on('message', (msg: SocketServerMessage) => {
      this.serverMessageSubject.next(msg)
      console.log('msg: ', msg)
    })
      .on('disconnect', () => {
        console.log('socket disconnected!')
      })
  }

  useSocketStatus () {
    const connected = useObservable(() => new Observable(subscriber => {
      this.socket
        .on('connect', () => subscriber.next('connect'))
        .on('reconnect', () => subscriber.next('reconnect'))
        .on('disconnect', (reason: string) => {
          if (reason === 'ping timeout') {
            subscriber.next('ping timeout')
            return
          }

          // if there wasn't a ping timout, the socket was closed intentionally
          if (reason === 'io server disconnect') {
            subscriber.next('io server disconnnect')
          } else {
            subscriber.next('io client disconnect')
          }
          this.serverMessageSubject.complete()
          subscriber.complete()
        })
    }), this.socket.connected)
    return connected
  }

  complete () {
    // observables will be cleaned up on disconnect handler
    this.socket.disconnect()
  }
}

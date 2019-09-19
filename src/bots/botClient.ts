import axios from 'axios';
import { SocketService } from '../client/_services/socket.service';
import { sleep } from '../common/helpers';
import IOClient from 'socket.io-client';
import config from '../common/config';
import { UserLogin, UserDetails, SocketServerMessage } from '../common/types';
import { isInterfaceDeclaration } from '@babel/types';
import { Observable } from 'rxjs';
import { Http2SecureServer } from 'http2';
import { SSL_OP_EPHEMERAL_RSA } from 'constants';


const { API_ROUTE } = config;

const LOGIN_ROUTE = 'http://localhost:3000/api/login';
const SOCKET_ROUTE = 'http://localhost:3000';


export class BotClient {
  private serverMessage$: Observable<SocketServerMessage>;

  constructor(private socket: SocketIOClient.Socket, private user: UserDetails) {
    this.serverMessage$ = new Observable(subscriber => {
      this.socket.on('message', (msg: SocketServerMessage) => {
        subscriber.next(msg)
      })
    })

    this.serverMessage$.subscribe(msg => {
      console.log('msg: ', msg);

    })
    console.log('conn', this.socket.connected);
    sleep(1000).then(() => console.log('conn: ', this.socket.connected))
  }

  getSocketStatusObservable() {
    return new Observable(subscriber => {
      this.socket
        .on('connect', () => subscriber.next('connect'))
        .on('reconnect', () => subscriber.next('reconnect'))
        .on('disconnect', (reason: string) => {
          if (reason === 'ping timeout') {
            subscriber.next('ping timeout')
            return;
          }
          // if there wasn't a ping timout, the socket was closed intentionally
          if (reason === 'io server disconnect') {
            subscriber.next('io server disconnnect');
          } else {
            subscriber.next('io client disconnect');
          }
        });
    })
  }
}

const newClient = async (username: string) => {
  const res = await axios.put(
    LOGIN_ROUTE, { username, userType: 'bot' }
  );
  console.log('resolved');
  const socket = IOClient(SOCKET_ROUTE, {
    transportOptions: {
      polling: {
        extraHeaders: {'cookie': res.headers['set-cookie']},
      }
    }
  });
  return new BotClient(socket, res.data as UserDetails)
}

(async () => {
  const client1 = newClient('billy');
  const client2 = newClient('bob');
})();

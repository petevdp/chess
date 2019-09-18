import axios from 'axios';
import { SocketService } from '../client/_services/socket.service';
import IOClient from 'socket.io-client';
import config from '../common/config';
import { UserLogin, UserDetails, SocketServerMessage } from '../common/types';
import { isInterfaceDeclaration } from '@babel/types';
import { Observable } from 'rxjs';
import { Http2SecureServer } from 'http2';


const { API_ROUTE } = config;

const LOGIN_ROUTE = 'http://localhost:3000/api/login';
const SOCKET_ROUTE = 'http://localhost:3000/socket.io';


export class BotClient {
  private serverMessage$: Observable<SocketServerMessage>;

  constructor(private socket: SocketIOClient.Socket, private user: UserDetails) {
    this.serverMessage$ = new Observable(subscriber => {
      this.socket.on('message', (msg: SocketServerMessage) => {
        console.log(msg);
        subscriber.next(msg)
      })
        .on('connect', () => {
          console.log('connected');
        })
    })
    console.log('conn', this.socket.connected);
  }

}

const newClient = async (username: string) => {
  const res = await axios.put(
    LOGIN_ROUTE, { username, userType: 'bot' }
  );
  console.log('resolved');
  console.log(res.headers['set-cookie'])
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
  const client = await newClient('billy');
  console.log('here\'s billy');
})();

import { Injectable } from '@angular/core';
import { SocketService } from './socket.service';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GameService {

  messages: Subject<any>;

  constructor(private wsService: SocketService) {
    this.messages = wsService
      .connect();
  }

  sendMsg(msg) {
    this.messages.next(msg);
  }
}

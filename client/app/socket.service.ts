import { Injectable } from '@angular/core';
import { environment } from 'client/environments/environment.prod';
import * as io from 'socket.io-client'
import { Subject, Observable, Observer } from 'rxjs';
import { RoomsDetails } from 'APIInterfaces/roomDetails';
import { LoginService } from './login.service';


@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket;

  constructor(
    private loginService: LoginService
  ) {
    this.socket = io('http://localhost:3000');
    this.loginService.currentUsername.subscribe(username => {
      if (username) {
        console.log('setting username')
        this.socket.emit('set username', username);
      }
    });
  }

  onRoomIndexUpdate() {
    return new Observable<RoomsDetails>(observer => {
      this.socket.on('room update', ((roomsDetails: RoomsDetails) => {
        observer.next(roomsDetails);
      }));
    });
  }

  setUsername(username: string) {
  }

  host() {
    if (!this.socket) {
      throw new Error('socket not connected');
    }
    this.socket.emit('host');
  }
}

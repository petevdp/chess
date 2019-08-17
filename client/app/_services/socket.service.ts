import { Injectable } from '@angular/core';
import { environment } from 'client/environments/environment.prod';
import * as io from 'socket.io-client';
import { Observable, ReplaySubject, Subject } from 'rxjs';
import { RoomDetails } from 'APIInterfaces/roomDetails';
import { LoginService } from './login.service';
import { Router } from '@angular/router';
import { ClientMove, GameConfig } from 'APIInterfaces/api';


@Injectable({
  providedIn: 'root'
})
export class SocketService {
  roomsDetailsObservable: Observable<RoomDetails[]>;
  hostedRoomIdObservable: Observable<string>;
  gameConfigObservable: Observable<GameConfig>;
  gameConfig: GameConfig;

  private gameConfigSubject: ReplaySubject<GameConfig>;
  socket: any;

  constructor(
    private loginService: LoginService,
    private router: Router
  ) {
    console.log('init sockets');
    this.socket = io('http://localhost:3000');
    this.loginService.currentUsername.subscribe(username => {
      if (username) {
        console.log('setting username');
        this.socket.emit('set username', username);
      }
    });

    this.roomsDetailsObservable = new Observable<RoomDetails[]>(subscriber => {
      this.socket.on('room update', (roomsDetails: RoomDetails[]) => {
        console.log('update: ', roomsDetails);
        subscriber.next(roomsDetails);
      });
    });

    this.hostedRoomIdObservable = new Observable<string>(subscriber => {
      this.socket.on('room create', (roomId: string) => {
        subscriber.next(roomId);
      });
    });

    this.gameConfigSubject = new ReplaySubject<GameConfig>(1);
    this.socket.on('init game', () => {
      console.log('init game');
      this.router.navigate(['play']);
    });
    this.gameConfigObservable = this.gameConfigSubject.asObservable();
  }


  setUsername(username: string) {
  }

  host(): void {
    if (!this.socket) {
      throw new Error('socket not connected');
    }
    this.socket.emit('host');
  }

  join(room_id): void {
    this.socket.emit('join', room_id);
  }
}

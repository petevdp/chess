import { Injectable } from '@angular/core';
import { environment } from 'client/environments/environment.prod';
import * as io from 'socket.io-client'
import { Subject, Observable, Observer, BehaviorSubject } from 'rxjs';
import { RoomsDetails } from 'APIInterfaces/roomDetails';
import { LoginService } from './login.service';
import { Router } from '@angular/router';


@Injectable({
  providedIn: 'root'
})
export class SocketService {
  public roomsDetailsObservable: Observable<RoomsDetails>;
  public hostedRoomIdObservable: Observable<string>;

  private socket;
  private roomsDetailsSubject: BehaviorSubject<RoomsDetails>;
  private hostedRoomIdSubject: BehaviorSubject<string>;

  constructor(
    private loginService: LoginService,
    private router: Router
  ) {
    this.socket = io('http://localhost:3000');
    this.loginService.currentUsername.subscribe(username => {
      if (username) {
        console.log('setting username')
        this.socket.emit('set username', username);
      }
    });

    this.roomsDetailsSubject = new BehaviorSubject<RoomsDetails>([]);
    this.hostedRoomIdSubject = new BehaviorSubject<string>(null);

    this.socket.on('room update', ((roomsDetails: RoomsDetails) => {
       this.roomsDetailsSubject.next(roomsDetails);
    }));

    this.socket.on('room create', (room_id: string) => {
      console.log('created room: ', room_id);
      this.hostedRoomIdSubject.next(room_id);
    });

    this.socket.on('start game', (out) => {
      console.log('out:', out);
      this.router.navigate(['play']);
    })

    this.roomsDetailsObservable = this.roomsDetailsSubject.asObservable();
    this.hostedRoomIdObservable = this.hostedRoomIdSubject.asObservable();

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

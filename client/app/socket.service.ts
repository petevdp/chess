import { Injectable } from '@angular/core';
import { environment } from 'client/environments/environment.prod';
import * as io from 'socket.io-client'
import { Subject, Observable, Observer } from 'rxjs';

export interface RoomDetails {
  room_id: string;
}

export interface RoomsDetails  {
  [index: number]: RoomDetails;
}

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket;

  constructor() {}

  connect() {
    this.socket = io('http://localhost:3000/rooms');
  }

  onRoomIndexUpdate() {
    return new Observable<RoomsDetails>(observer => {
      this.socket.on('room update', ((roomsDetails: RoomsDetails) => {
        observer.next(roomsDetails);
      }));
    });
  }

  setUsername(username: string) {
    this.socket.emit('set username', username);
  }

  host() {
    if (!this.socket) {
      throw new Error('socket not connected');
    }
    this.socket.emit('host');
  }
}

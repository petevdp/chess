import { Injectable } from '@angular/core';
import { Observer, Observable } from 'rxjs';
import * as io from 'socket.io-client';

export interface RoomDetails {
  room_id: string;
}

export interface RoomsDetails  {
  [index: number]: RoomDetails;
}

@Injectable({
  providedIn: 'root'
})
export class RoomIndexService {
  private socket;

  constructor() {}

  connect() {
    this.socket = io('http://localhost:3000/rooms');
  }

  onRoomIndexUpdate(): Observable<RoomsDetails> {
    return new Observable<RoomsDetails>(observer => {
      this.socket.on('room update', ((roomsDetails: RoomsDetails) => {
        observer.next(roomsDetails);
      }));
    });
  }

  host() {
    if (!this.socket) {
      throw new Error('socket not connected');
    }
    this.socket.emit('host');
  }
}

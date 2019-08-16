import { Component, OnInit } from '@angular/core';
import { SocketService } from '../../_services/socket.service';
import { Observer, Observable } from 'rxjs';
import { RoomDetails } from 'APIInterfaces/roomDetails';

@Component({
  selector: 'app-room-index',
  templateUrl: './room-index.component.html',
  styleUrls: ['./room-index.component.scss'],
})
export class RoomIndexComponent implements OnInit {

  roomsDetails: RoomDetails[] = [];
  hostedRoomId: string;

  constructor(private socketService: SocketService) { }

  ngOnInit() {
    console.log('initializing room-index component');
    this.socketService.roomsDetailsObservable.subscribe((details: RoomDetails[]) => {
      console.log('details: ', details);
      this.roomsDetails = details;
    });

    this.socketService.hostedRoomIdObservable.subscribe((room_id: string) => {
      this.hostedRoomId = room_id;
    });

    this.socketService.gameConfigObservable.subscribe((gameConfig) => {
      console.log('game config board cb', gameConfig);
    });
    console.log('gameConfig in room index', this.socketService.gameConfig);
  }

  hostRoom() {
    this.socketService.host();
  }

  joinRoom(room_id) {
    if (room_id === this.hostedRoomId) {
      console.log('already in this room');
      return;
    }
    console.log(`joining room ${room_id}`);
    this.socketService.join(room_id);
  }
}

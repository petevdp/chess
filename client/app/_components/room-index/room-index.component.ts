import { Component, OnInit } from '@angular/core';
import { SocketService } from '../../_services/socket.service';
import { Observer, Observable } from 'rxjs';
import { RoomsDetails } from 'APIInterfaces/roomDetails';

@Component({
  selector: 'app-room-index',
  templateUrl: './room-index.component.html',
  styleUrls: ['./room-index.component.scss'],
  providers: [SocketService]
})
export class RoomIndexComponent implements OnInit {

  roomsDetails: RoomsDetails = [];
  hostedRoomId: string;

  constructor(private socketService: SocketService) { }

  ngOnInit() {
    console.log(this.socketService);
    this.socketService.roomsDetailsObservable.subscribe((details: RoomsDetails) => {
      console.log('details: ', details);
      this.roomsDetails = details;
    });

    this.socketService.hostedRoomIdObservable.subscribe((room_id: string) => {
      this.hostedRoomId = room_id;
    });
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

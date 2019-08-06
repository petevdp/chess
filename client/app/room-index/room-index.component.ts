import { Component, OnInit } from '@angular/core';
import { SocketService, RoomDetails, RoomsDetails } from '../socket.service';
import { Observer, Observable } from 'rxjs';

@Component({
  selector: 'app-room-index',
  templateUrl: './room-index.component.html',
  styleUrls: ['./room-index.component.scss'],
  providers: [SocketService]
})
export class RoomIndexComponent implements OnInit {

  roomsDetails: RoomsDetails = [];

  constructor(private socketService: SocketService) { }

  ngOnInit() {
    this.socketService.connect();
    console.log(this.socketService);
    const roomIndexUpdates = this.socketService.onRoomIndexUpdate() as Observable<RoomsDetails>;

    roomIndexUpdates.subscribe((details: Array<RoomDetails>) => {
      console.log('details: ', details);
      this.roomsDetails = details;
    })
  }

  hostRoom() {
    this.socketService.host();
  }
}

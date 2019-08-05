import { Component, OnInit } from '@angular/core';
import { RoomIndexService, RoomDetails, RoomsDetails } from '../room-index.service';
import { Observer, Observable } from 'rxjs';

@Component({
  selector: 'app-room-index',
  templateUrl: './room-index.component.html',
  styleUrls: ['./room-index.component.scss'],
  providers: [RoomIndexService]
})
export class RoomIndexComponent implements OnInit {

  roomsDetails: RoomsDetails = [];

  constructor(private roomIndexService: RoomIndexService) { }

  ngOnInit() {
    this.roomIndexService.connect();
    const roomIndexUpdates = this.roomIndexService.onRoomIndexUpdate() as Observable<RoomsDetails>;

    roomIndexUpdates.subscribe((details: Array<RoomDetails>) => {
      console.log('details: ', details);
      this.roomsDetails = details;
    })
  }

  hostRoom() {
    this.roomIndexService.host();
  }
}

export interface RoomDetails {
  room_id: string;
  host_username: string;
}

export interface RoomsDetails  {
  [index: number]: RoomDetails;
}

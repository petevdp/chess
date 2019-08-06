import * as uuidv4 from 'uuid/v4';

class Room {
  host_username: any;
  players: any[];
  room_id: string;
  _host: any;
  constructor(socket, host_username) {
    this.players = [];
    this.host_username = host_username;
    console.log('hosted!');
    this.room_id = `room/${uuidv4()}`;
    this.join(socket);
  }
  addPlayer(socket){
  }

  getDetails = () => ({
    room_id: this.room_id,
    host_username: this.host_username,
  })


  join = socket => {
    const joinable = () => this.players.length < 2;
    const empty = () => this.players.length === 0;

    if (!joinable()) {
      throw new Error('room is full!');
    }
    if (empty()) {
      this._host = socket;
    }
    this.players.push(socket);
    console.log('player joined game!');
  }

}

export class RoomsController {
  _io: any;
  _rooms: any[];
  constructor(io) {
    this._io = io;
    this._rooms = [];
    this._handleRoomUpdates();
  }

  _getRoomsDetails = () => (
    this._rooms.map(room => room.getDetails())
  )

  _broadcastRoomsUpdate() {
    this._io.emit('room update', this._getRoomsDetails());
  }
  _deleteRoom(uuid) {
    const index = this._rooms.findIndex(room => room.uuid === uuid);
  }

  _handleRoomUpdates () {
    this._io.on('connection', socket => {
      console.log('connected to rooms!');
      socket.emit('rooms', this._getRoomsDetails());

      socket.on('host', (username: string) => {
        console.log('hosting!!');
        this._rooms.push(new Room(socket, username));
        this._broadcastRoomsUpdate();
      });

      socket.on('join', (room_id) => {
        this._rooms.find(room => room.room_id === room_id).join(socket);
        this._broadcastRoomsUpdate();
      });
    });

  }
}

const uuidv4 = require('uuid/v4');

class Room {
  constructor(socket) {
    this.players = [];
    console.log('hosted!')
    this.room_id = `room/${uuidv4()}`;
    this.join(socket)
  }
  addPlayer(socket){
  }

  getDetails = () => ({
    room_id: this.room_id,
  });


  join = socket => {
    const joinable = () => this.players.length < 2;
    const empty = () => this.players.length === 0;

    if (!joinable()) {
      throw 'room is full!';
    }
    if (empty()) {
      this._host = socket;
    }
    this.players.push(socket);
    console.log('player joined game!')
  }

}

class RoomsController {
  constructor(io) {
    this._io = io;
    this._rooms = [];
    this._handleRoomUpdates();
  }

  _getRoomsDetails = () => (
    this._rooms.map(room => room.getDetails())
  )

  _broadcastRoomsUpdate() {
    this._io.emit('room update', this._getRoomsDetails())
  }

  _hostRoom(socket) {
    this._rooms.push(new Room(socket));
  }

  _deleteRoom(uuid) {
    const index = this._rooms.findIndex(room => room.uuid === uuid)
  }

  _handleRoomUpdates () {
    this._io.on('connection', socket => {
      console.log('connected to rooms!')
      socket.emit('rooms', this._getRoomsDetails());

      socket.on('host', () => {
        console.log('hosting!!');
        this._rooms.push(new Room(socket))
        this._broadcastRoomsUpdate()
      })

      socket.on('join', (room_id) => {
        this._rooms.find(room => room.room_id === room_id).join(socket)
        this._broadcastRoomsUpdate()
      })
    });

  }
}

module.exports= {
  RoomsController,
};

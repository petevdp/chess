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
    const joinable = () => this._players.length < 2;
    const empty = () => this.players.length === 0;

    if (!joinable()) {
      throw 'room is full!'
    }
    if (empty()) {
      this._host = socket;
    }
    this._players.push(socket);
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

  _broadcastRooms() {
    this._io.emit('rooms', this._getRoomsDetails())
  }

  _hostRoom(socket) {
    this._rooms.push(new Room(socket));
  }

  _deleteRoom(uuid) {
    const index = this._rooms.findIndex(room => room.uuid === uuid)
  }

  _handleRoomUpdates () {
    this._io.on('connection', socket => {
      console.log('connected!')
      socket.emit('rooms', this._getRoomsDetails())
    });

    socket.on('host', () => {
      this._rooms.push(new Room(socket))
    })

    socket.on('join', (room_id) => {
      this._rooms.find(room => room.room_id === room_id).join(socket)
    })
  }
}

module.exports({
  RoomsController,
})

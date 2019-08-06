const SocketIO = require('socket.io');
const { RoomsController } = require('./rooms')
// const { GamesController } = require('./games')

export default (http) => {
  const io = SocketIO(http);
  const roomsController = new RoomsController(io.of('/rooms'));
  // const gamesController = new GamesController(io.of('/games'))
}

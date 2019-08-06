export class User {
}

export function UsersFactory(parent_io) {
  const io = parent_io.of('/users');

  io.on('connection', (socket: any) => {

  })
}

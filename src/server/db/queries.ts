import { createPool, sql, DatabasePoolConnectionType } from 'slonik';
import { UserDetails } from '../../common/types';

const CONN_STRING = 'postgres://chess_development:chess_development@localhost:5432/chess_development'

const Queries = (connection: DatabasePoolConnectionType) => ({
  getUser: (id: string) => connection.query(sql`
    SELECT * FROM users WHERE id = ${id}
  `),

  addUser: ({id, username}: UserDetails) => connection.query(sql`
    INSERT INTO users(id, username)
    VALUES
      (${id}, ${username})
  `),

  deleteUser: (id: string) => connection.query(sql`
    DELETE FROM users
    WHERE id = ${id}
  `)
});

export default () => {
  const pool = createPool(CONN_STRING);
  return pool.connect(async connection => {
    return Queries(connection);
  })
};

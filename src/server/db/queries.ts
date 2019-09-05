import { createPool, sql, DatabasePoolConnectionType, QueryResultType, QueryResultRowType, QueryMaybeOneFunctionType, DatabasePoolType } from 'slonik';
import { UserDetails } from '../../common/types';

const CONN_STRING = 'postgres://chess_development:chess_development@localhost:5432/chess_development';

export type QueryOutput = Promise<QueryResultType<QueryResultRowType<string>>>;
export interface IQueries {
  getUser: (key: string, value: any) => QueryOutput;
  addUser: (UserDetails) => QueryOutput
  deleteUser: (string) => QueryOutput;
}

export class DBQueries {
  private pool: DatabasePoolType;
  constructor() {
    this.pool = createPool(CONN_STRING);
  }

  private singleQuery(query) {
    return this.pool.connect(connection => {
      return connection.query(query);
    })
  }

  getUserById(value: string) {
    return this.singleQuery(sql`
      SELECT * FROM users WHERE id = ${value}
    `);
  };

  getUserByUsername(value: string) {
    return this.singleQuery(sql`
      SELECT * FROM users WHERE username = ${value}
    `);
  };

  addUser({ id, username }: UserDetails) {
    return this.singleQuery(sql`
      INSERT INTO users(id, username)
      VALUES
        (${id}, ${username})
    `)
  }

  deleteUser({ id, username }: UserDetails) {
    return this.singleQuery(sql`
    DELETE FROM users
    WHERE id = ${id}
  `);
  }
}

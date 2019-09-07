import uuidv4 from 'uuid/v4';
import errors from 'errors';
import { createPool, sql, DatabasePoolConnectionType, QueryResultType, QueryResultRowType, QueryMaybeOneFunctionType, DatabasePoolType } from 'slonik';
import { UserDetails } from '../../common/types';
import to from 'await-to-js';

const CONN_STRING = 'postgres://chess_development:chess_development@localhost:5432/chess_development';

export type QueryOutput = Promise<QueryResultType<QueryResultRowType<string>>>;
export interface QueriesInterface {
  getUser: (id: string) => QueryOutput;
  addUser: (userDetails: UserDetails) => QueryOutput
  deleteUser: (str: string) => QueryOutput;
}

export class DBQueries {
  private pool: DatabasePoolType;
  constructor() {
    this.pool = createPool(CONN_STRING);
  }

  private singleQuery(query) {
    return this.pool.connect(connection => {
      return connection.query<QueryResultRowType>(query);
    })
  }

  async getUserById(id: string) {
    return this.singleOutput(this.singleQuery(sql`
      SELECT * FROM users WHERE id = ${id}
    `));
  };

  async getUserByUsername(value: string) {
    return this.singleOutput(this.singleQuery(sql`
      SELECT * FROM users WHERE username = ${value}
    `));
  };

  private async getUser(connection: DatabasePoolConnectionType, username: string) {
    return this.singleOutput(connection.query(sql`
      SELECT * FROM users WHERE username = ${username}
    `));
  }

  /**
   * gets a user, or adds and gets if user doesn't exist
   * @param username
   * @returns UserDetails
   */
  getOrAddUser(username: string) {
    return this.pool.connect(async (connection) => {
      let user = await this.getUser(connection, username);
      if (!user) {
        await to(connection.query(sql`
          INSERT INTO users(id, username)
          VALUES(${uuidv4()}, ${username})
        `))
        user = await this.getUser(connection, username);
      }
      return user;
    });
  }

  deleteUser({ id, username }: UserDetails) {
    return this.singleQuery(sql`
    DELETE FROM users
    WHERE id = ${id}
  `);
  }

  private async singleOutput(query: Promise<QueryResultType<QueryResultRowType>>) {
    const { rows } = await query;
    return rows.length === 1 && rows[0];
  }
}

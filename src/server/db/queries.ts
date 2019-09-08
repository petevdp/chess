import uuidv4 from 'uuid/v4';
import errors from 'errors';
import { createPool, sql, DatabasePoolConnectionType, QueryResultType, QueryResultRowType, QueryMaybeOneFunctionType, DatabasePoolType, CommonQueryMethodsType } from 'slonik';
import { UserDetails, UserDetailsPartial } from '../../common/types';
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

  async getUser(detailsPartial: UserDetailsPartial) {
    return this.pool.connect(connection => this._getUser(detailsPartial, connection));
  }

  async _getUser({ username, id }: UserDetailsPartial, connection) {
    if (id) {
      return connection.maybeOne(sql`
        SELECT * FROM users WHERE id = ${id}
      `);
    }
    if (username) {
      return connection.maybeOne(sql`
        SELECT * FROM users WHERE username = ${username}
      `);
    }
    throw errors.create({name: 'ParamEmptyError', description: 'needs at least one for query'})
  };


  private async _addUser(connection: DatabasePoolConnectionType, username: string, id = null): Promise<UserDetails> {
    return connection.maybeOne(sql`
          INSERT INTO users(id, username)
          VALUES(${id || uuidv4()}, ${username})
        `);
  }

  /**
   * gets a user, or adds and gets if user doesn't exist
   * @param username
   * @returns UserDetails
   */
  getOrAddUser(username: string): Promise<UserDetails> {
    return this.pool.connect(async (connection) => {
      let user = await this._getUser({username}, connection);
      if (!user) {
        await this._addUser(connection, username);
        user = await this._getUser({username}, connection);
      }
      return user;
    });
  }
}

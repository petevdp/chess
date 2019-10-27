import uuidv4 from 'uuid/v4'
import { createPool, sql, DatabasePoolConnectionType, QueryResultType, QueryResultRowType, DatabasePoolType } from 'slonik'
import { UserDetails, UserDetailsPartial, UserType } from '../../common/types'

const CONN_STRING = 'postgres://chess_development:chess_development@localhost:5432/chess_development'

export type QueryOutput = Promise<QueryResultType<QueryResultRowType<string>>>;
export interface QueriesInterface {
  getUser: (id: string) => QueryOutput;
  addUser: (userDetails: UserDetails) => QueryOutput;
  deleteUser: (str: string) => QueryOutput;
}

export class DBQueries {
  private pool: DatabasePoolType;
  constructor () {
    this.pool = createPool(CONN_STRING)
  }

  async getUser (detailsPartial: UserDetailsPartial) {
    return this.pool.connect(connection => this._getUser(detailsPartial, connection))
      .catch(() => {
        throw new Error(`Couldn't get user with details ${detailsPartial}`)
      })
  }

  async _getUser (
    { username, id }: UserDetailsPartial,
    connection: DatabasePoolConnectionType
  ) {
    let row: QueryResultRowType<string> | null
    if (id) {
      row = await connection.maybeOne(sql`
        SELECT * FROM main.users WHERE id = ${id}
      `)
    } else if (username) {
      row = await connection.maybeOne(sql`
        SELECT * FROM main.users WHERE username = ${username}
      `)
    } else {
      throw new Error('needs at least one for query')
    }
    if (!row) {
      return false
    }
    return row as unknown as UserDetails
  };

  private async _addUser (
    connection: DatabasePoolConnectionType,
    username: string,
    type: UserType,
    id = null
  ): Promise<void> {
    connection.query(sql`
          INSERT INTO main.users(id, username, type)
          VALUES(${id || uuidv4()}, ${username}, ${type})
        `)
  }

  /**
   * gets a user, or adds and gets if user doesn't exist
   * @param username
   * @param type
   * @returns UserDetails
   */
  getOrAddUser (username: string, type: UserType): Promise<UserDetails> {
    return this.pool.connect(async (connection) => {
      let user = await this._getUser({ username }, connection)
      if (!user) {
        await this._addUser(connection, username, type)
        user = await this._getUser({ username }, connection) as UserDetails
      }
      return user
    })
  }
}

import uuidv4 from 'uuid/v4'
import { createPool, sql, DatabasePoolConnectionType, QueryResultType, QueryResultRowType, DatabasePoolType } from 'slonik'
import { UserDetails, UserDetailsPartial, UserType, CompletedGameInfo } from '../../common/types'

const CONN_STRING = 'postgres://chess_development:chess_development@localhost:5432/chess_development'

export type QueryOutput = Promise<QueryResultType<QueryResultRowType<string>>>;
export interface DBQueriesInterface {
  getUser: (details: UserDetailsPartial) => Promise<false | UserDetails>;
  putUser: (username: string, type: UserType) => Promise<UserDetails>;
  // deleteUser: (id: string) => Promise<QueryOutput>;
  addCompletedGame: (info: CompletedGameInfo) => Promise<boolean>;
  // getGame: (id: string) => Promise<CompletedGameInfo>;
  getGame: (id: string) => Promise<void>;
}
export default class DBQueries implements DBQueriesInterface {
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
  putUser (username: string, type: UserType): Promise<UserDetails> {
    return this.pool.connect(async (connection) => {
      let user = await this._getUser({ username }, connection)
      if (!user) {
        await this._addUser(connection, username, type)
        user = await this._getUser({ username }, connection) as UserDetails
      }
      return user
    })
  }

  complete () {
  }

  async addCompletedGame ({ id, playerDetails, pgn, end }: CompletedGameInfo) {
    const [white, black] = playerDetails.sort((a) => a.colour === 'w' ? -1 : 1)
    const { reason, winnerId } = end
    await this.pool.query(sql`
      INSERT INTO main.games(id, white_id, black_id, pgn, winner_id, end_reason)
      VALUES (${sql.valueList([id, white.user.id, black.user.id, pgn, winnerId, reason])})
    `)
    return true
  }

  async getGame (id: string) {
    const out = await this.pool.maybeOne(sql`
      SELECT * FROM main.games WHERE id = ${id}
    `)
    console.log('out: ')
    console.log(out)
  }
}

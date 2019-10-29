import { createPool, sql } from 'slonik'

const pool = createPool('postgres://chess_development:chess_development@localhost:5432/chess_development')

pool.connect(async connection => {
  await connection.query(sql`
    DROP SCHEMA IF EXISTS main CASCADE
  `)
  await connection.query(sql`
    CREATE SCHEMA main
  `)

  await connection.query(sql`
    CREATE TABLE main.users (
      id varchar(36) PRIMARY KEY,
      username varchar(40) UNIQUE,
      type varchar(36)
    )
  `)

  await connection.query(sql`
    CREATE TABLE main.games (
      id varchar(36) PRIMARY KEY,
      white_id varchar(36) NOT NULL REFERENCES main.users(id),
      black_id varchar(36) NOT NULL REFERENCES main.users(id),
      pgn text NOT NULL,
      winner_id varchar(36) REFERENCES main.users(id),
      end_reason varchar(20) NOT NULL
    )
  `)
})

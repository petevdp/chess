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
})

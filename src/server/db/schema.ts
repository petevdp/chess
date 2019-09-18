import { createPool, sql } from 'slonik';

const pool = createPool('postgres://chess_development:chess_development@localhost:5432/chess_development');

pool.connect(async connection => {
  await connection.query(sql`
    DROP TABLE IF EXISTS users
  `)
  await connection.query(sql`
    CREATE TABLE users (
      id varchar(36) CONSTRAINT firstkey PRIMARY KEY,
      username varchar(40) UNIQUE,
      type varchar(36)
    )
  `);
  console.log('completed');
});

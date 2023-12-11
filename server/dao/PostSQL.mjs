import { Pool, Client } from 'pg'
 
const pool = new Pool({
  user: 'root',
  host: '172.18.0.2',
  database: 'test_db',
  password: 'root',
  port: 5432,
})
 
console.log(await pool.query('SELECT NOW()'))
 
const client = new Client({
  user: 'dbuser',
  host: '172.18.0.2',
  database: 'test_db',
  password: 'root',
  port: 5432,
})
 
await client.connect()
 
console.log(await client.query('SELECT NOW()'))
 
await client.end()
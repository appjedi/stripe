const { Pool, Client } =require('pg');
 
async function test1()
{
  const pool = new Pool({
    user: 'root',
    host: '172.18.0.2',
    database: 'test_db',
    password: 'root',
    port: 5432,
  })
  
  console.log(await pool.query('SELECT NOW()'))
}
async function test2()
{
  const client = new Client({
    user: 'root',
    host: '172.18.0.2',
    database: 'test_db',
    password: 'root',
    port: 5432,
  })
  
  await client.connect()
  
  console.log(await client.query('SELECT NOW()'));
  
  await client.end();
}
test2();
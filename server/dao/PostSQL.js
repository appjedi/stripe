const { Pool, Client } = require('pg');

async function getConn() {
  const client = new Client({
    user: 'root',
    host: 'localhost',
    database: 'test_db',
    password: 'root',
    port: 5432,
  });
  await client.connect();
  return client;
}
async function insertUser(user, pwd, roleId, status) {
  try {
    const id = await getNextID("users", "user_id");
    const conn = await getConn();
    const insert = "INSERT INTO users (user_id, username,password,role_id, status, created) VALUES ($1,$2,$3,$4,$5,$6)";
    const dt = new Date();


    const values = [id, user, pwd, roleId, status, dt];
    console.log("VALUES:", values);
    conn.query(insert, values);
    await conn.end();
    //conn.commit();
  } catch (ex) {
    console.log("ERROR:", ex);
  }
}
async function getUsers() {
  const conn = await getConn();
  const results = await conn.query("SELECT * FROM users");
  //  console.log(await client.query('SELECT NOW()'));
  for (let row of results.rows)
    console.log(row.username);
  await conn.end();
}
async function getNextID(tbl, col) {
  const conn = await getConn();
  const query = `SELECT MAX(${col}) AS id FROM ` + tbl;
  console.log(query);
  const results = await conn.query(query);
  // console.log(results.rows);
  const id = results.rows[0].id + 1;
  //console.log("ID:", id);
  conn.end();
  return id;
}

async function testIt() {
  const id = await getNextID("users", "user_id");
  console.log("Test Reults:", id);
}
//testIt();

insertUser("jan4", "Jan20240119", 1, 1);
//getUsers();
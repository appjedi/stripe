const { Sequelize, DataTypes, QueryTypes } = require("sequelize");

const conn = {
  user: "",
  password: "",
  host: "0.0.0.0",
  dialect: "sqlite",
  pool: {
    max: 5,
    min: 0,
    idle: 10000,
  },
  storage: "./data.db",
};
let sequelize;

let connection;
class SQLConn {
  constructor(connObj) {
    connection = connObj;
    this.init();
  }
  init = () => {
    sequelize = new Sequelize(connection);
    sequelize
      .authenticate()
      .then(() => {
        console.log("database connected");
      })
      .catch((error) => {
        console.error("Unable to connect: ", error);
      });
  };
  query = async (query, values) => {
    try {
      const results = await sequelize.query(query, {
        replacements: values,
        type: QueryTypes.SELECT,
      });
      // console.log(results);
      return results;
    } catch (e) {
      console.log("query.error", e);
      return [{ status: -1, message: e }];
    }
  };
  execute = async (query, values) => {
    try {
      const results = await sequelize.query(query, {
        replacements: values,
      });
      return results;
    } catch (e) {
      console.log("execute.error", e);
      return [{ status: -1, message: e }];
    }
  };
}
// 414-401-5454
async function insertUser(un, pw) {
  try {
    const db = new SQLConn(conn);

    const insert = `INSERT INTO users (username,password,role_id, status) VALUES(?,?, 1,1);`;
    const values = [un, pw];
    db.execute(insert, values);
    console.log("user created.");
  } catch (ex) {
    console.log("error:", ex);
  }
}
const tables = [
  "CREATE TABLE logger (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, message VARCHAR(4000) DEFAULT NULL, log_date DATETIME DEFAULT NULL)",
  "CREATE TABLE users2 (id INTEGER PRIMARY KEY AUTOINCREMENT, username VARCHAR(50),password  VARCHAR(50),role_id INTEGER, status INTEGER)"
];
const createTables = async () => {
  try {
    const db = new SQLConn(conn);
    for (let t of tables) {
      // console.log(`about to create ${t}.`);

      db.execute(t);
      console.log(`table ${t} created.`);
    }
    //const values = [un, pw];
    console.log("table created.");
  } catch (ex) {
    console.log("error:", ex);
  }
}
const createTableUser = async () => {
  try {
    const db = new SQLConn(conn);

    const create =
      "CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username VARCHAR(50),password  VARCHAR(50),role_id INTEGER, status INTEGER)";
    //const values = [un, pw];
    db.execute(create);
    console.log("table created.");
  } catch (ex) {
    console.log("error:", ex);
  }
}
async function main() {
  const db = new SQLConn(conn);
  const rows = await db.query("SELECT * FROM users", null);
  console.log(rows);
}
//insertUser("testerb", 'Test1234');
//createTableUser();
//createTables();
main();
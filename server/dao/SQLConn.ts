const { Sequelize, DataTypes, QueryTypes } = require("Sequelize");

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
    const results = await sequelize.query(query, {
      replacements: values,
      type: QueryTypes.SELECT,
    });
    // console.log(results);
    return results;
  };
  execute = async (query, values) => {
    const results = await sequelize.query(query, {
      replacements: values,
    });
    return results;
  };
}

//export default SQLConn;

//process.env.USER, process.env.PASSWORD;

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
async function insertTest(un, pw) {
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
async function main() {
  const db = new SQLConn(conn);
  const rows = await db.query("SELECT * FROM users", null);
  console.log(rows);
}
//insertTest("tuesday", 'Test1234');
main();

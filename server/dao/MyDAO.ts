import { Sequelize, DataTypes, QueryTypes } from "sequelize";

let sequelize: Sequelize;

interface DBConnection {
  database: string;
  user: string;
  password: string;
  host: string;
  dialect: string;
}
let connection: DBConnection;
let User: any;
/*
const User = sequelize.define("users", {
  username: {
    type: DataTypes.STRING,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  roleId: {
    type: DataTypes.INTEGER,
  }
});
*/
class MyDAO {
  constructor(connObj: any) {
    connection = connObj;
    this.init();
  }
  init = () => {
    sequelize = new Sequelize(
      connection.database,
      connection.user,
      connection.password,
      {
        host: connection.host,
        dialect: "mysql",
      }
    );
    sequelize
      .authenticate()
      .then(() => {
        console.log("database connected");
      })
      .catch((error) => {
        console.error("Unable to connect: ", error);
      });
  };
  query = async (
    query: string,
    values: Array<Object>
  ): Promise<Array<Object>> => {
    try {
      const results = await sequelize.query(query, {
        replacements: values,
        type: QueryTypes.SELECT,
      });
      console.log("query.results", results);
      return results;
    } catch (e) {
      console.log("query.error", e);
      return [{ status: -1, message: e }];
    }
  };
  execute = async (query: string, values: Array<Object>) => {
    try {
      const results = await sequelize.query(query, {
        replacements: values,
      });
      if (results) {
        return results;
      } else return [{ status: 1, message: "done" }];
    } catch (e) {
      console.log("query.error", e);
      return [{ status: -1, message: e }];
    }
  };
  getConn = () => {
    return sequelize;
  };
}
export default MyDAO;

import { Sequelize, DataTypes,QueryTypes } from 'Sequelize';
//import { iniParams } from 'request-promise';

let sequelize:Sequelize;

interface DBConnction{
    database: string;
    user: string;
    password: string;
    host: string;
    dialect: string;
}
let connection:DBConnction;
class MyDAO
{
    constructor(connObj)
    {
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
                //dialect: connection.dialect
            }
        );
        sequelize.authenticate().then(() => {
            console.log("database connected");
        }).catch((error) => {
            console.error("Unable to connect: ", error);
        })
    }
    query=async(query:string, values:Array<Object>):Promise<Array<Object>>=> {
        const results = await sequelize.query(query, {
            replacements: values, type: QueryTypes.SELECT
        });
        console.log(results);
        return results;
    }
    execute=async(query:string, values:Array<Object>)=> {
        const results = await sequelize.query(query, {
            replacements: values
        });
        return results;
    }
}
export default MyDAO;
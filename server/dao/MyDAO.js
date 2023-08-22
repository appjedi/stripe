const { Sequelize, DataTypes } = require('Sequelize');
const { iniParams } = require('request-promise');

let sequelize;
let connection;
module.exports =
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
                dialect: connection.dialect
            }
        );
        sequelize.authenticate().then(() => {
            console.log("database connected");
        }).catch((error) => {
            console.error("Unable to connect: ", error);
        })
    }
    query=async(query, values)=> {
        const results = await sequelize.query(query, {
            replacements: values, type: sequelize.QueryTypes.SELECT
        });
        console.log(results);
        return results;
    }
    execute=async(query, values)=> {
        const results = await sequelize.query(query, {
            replacements: values
        });
        return results;
    }
}

const env = {
    CLIENT_URL:"https://appdojo.net:3000/",
    STRIPE_PRIVATE_KEY_PROD:"sk_live_zKwK9ePish8SWiI0QrRYrdoQ",
    STRIPE_PRIVATE_KEY:"sk_test_WGocjwW9Qm4LbHyK2fFmnBDa",
    MONGO_URL:"mongodb + srv://appuser:AppData2022@cluster0.aga82.mongodb.net/wkk",
    MONGO_DEV_URL:"mongodb://localhost:27017/wkk",
    SERVER_URL:"http://localhost:3000",
    MYSQL_PROD:'{ "host": "appdojo.net", "user": "appjedin_sensei", "database": "appjedin_training", "password": "Sensei2022!", "dialect": "mysql" }',
    MYSQL_DEV:'{ "host": "127.0.0.1", "user": "root", "database": "dev", "password": "Jedi2023", "dialect": "mysql" }',
}

console.log(JSON.stringify(env));
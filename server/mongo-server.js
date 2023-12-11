const { MongoClient } = require("mongodb");
const connectionString = "mongodb://localhost:27017/";
const client = new MongoClient(connectionString);
let conn;
const connect= async()=>{
    try {
        conn = await client.connect();
    } catch(e) {
    console.error(e);
    }
}


async function post()
{
    await connect();
    let db = conn.db("sample_training");
    let collection = await db.collection("posts");
  let newDocument ={id:1, message:"Hello World"};
  newDocument.date = new Date();
  let result = await collection.insertOne(newDocument);
    console.log(result);
}
async function get()
{
    await connect();
    let db = conn.db("sample_training");
    let collection = await db.collection("posts");
    let results = await collection.find({})
      .limit(50)
      .toArray();
    console.log(results);    
}
//post();
get();
require("dotenv").config()
const MySql = require('sync-mysql');
const path = require('path');

const GC_CONNECTIONS = [{
  host: 'localhost',
  user: 'root',
  database: 'training',
  password: 'Data1234'
},
{
  host: 'appdojo.net',
  user: 'appjedin_sensei',
  database: 'appjedin_training',
  password: 'Sensei2022!'
}, {
  host: "192.168.64.2", // Mac
  user: "training",
  password: "Test1234",
  database: "test",
  port: 3306
}
];
const GC_CONN_IDX = 1;
const connection = new MySql(GC_CONNECTIONS[GC_CONN_IDX]);
const port = 3000;
const bodyParser = require('body-parser');
const express = require("express");
const session = require('express-session');
const app = express();
app.use(session({ secret: 'XASDASDA' }));

const cors = require("cors");
app.use(express.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));

const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY);

//console.log("STRIPE KEY", process.env.STRIPE_PRIVATE_KEY)
const mongodb = require('mongodb');
const MongoClient = require('mongodb').MongoClient;
const GC_MONGO_URL =process.env.MONGO_URL;
const GC_PUBLIC_DIR = path.join(__dirname + '/public/index.html').split("/index.html")[0];

const storeItems = new Map([
  [1, { priceInCents: 20, name: "Intro to JavaScript" }],
  [2, { priceInCents: 50, name: "Learn React Today" }],
  [3, { priceInCents: 20, name: "Learn CSS Today" }],
])
let ssn;
const GC_RELEASE = "2023-01-28";
app.get("/release", (req, res) => {
  ssn = req.session;
  res.send(GC_RELEASE);
});
app.get ("/stripe",(req, res)=>{
        res.sendFile(path.join(__dirname+'/public/stripe.html'));
});
app.get('/login', (req, res) => {
  const form =
    `<html><head><title>login</title></head><body>
   <h1>Login Page </h1><p>${GC_RELEASE}</p>
   <form method="POST" action="/login">
    Username:<br><input type="text" name="username">
    <br>Password:<br><input type="text" name="password">
    <br><br><input type="submit" value="Submit"></form></body></html>`;

  res.send(form);

});
app.post('/login', async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  console.log("/login:", username);
  const auth = login(username, password);
  if (auth)
  {
    ssn = req.session;
    ssn.user = auth;  
  }
  res.send({ auth: auth });
});
function login(u, p) {

  try {
    const query = `SELECT * FROM users WHERE username='${u}' AND password= '${p}'`;
    console.log("LOGIN:", query);
    const results = connection.query(query);
    console.log(results);

    return results;
  } catch (e) {
    console.log("ERROR:", e);
    return null;
  }
}
app.get("/add2cart/:pid/:qty", (req, res) => {
  const item = { itemId: req.params.pid, quantity: req.params.qty };
  console.log("ITEM ", item);
});
app.get("/user/logout", (req, res) => {

  //  ssn=req.session;
  ssn.userId = undefined;
  ssn.token = undefined;
  res.send("logged out");
});
app.get("/user", (req, res) => {
  ssn = req.session;
  res.send(ssn.user);
});
app.post("/create-checkout-session", async (req, res) => {
  try {
    console.log("checkout");

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: req.body.items.map(item => {
        const storeItem = storeItems.get(item.id)
        return {
          price_data: {
            currency: "usd",
            product_data: {
              name: storeItem.name,
            },
            unit_amount: storeItem.priceInCents,
          },
          quantity: item.quantity,
        }
      }),
      success_url: `${process.env.CLIENT_URL} / success`,
      cancel_url: `${process.env.CLIENT_URL} / cancel`,
    })
    res.json({ url: session.url })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})
app.get("/test/:id", async (req, res) => {
  const data = getCharges(req.params.id);

  res.send(data);
});
app.get("/charge/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  console.log("/charge/" + id);
  const charge = await getCharge(id);
  console.log("charge: ", charge);
  res.send(charge);
})

/*
4242 4242 4242 4242
*/

app.get("/pay/:id", async (req, res) => {
  try{
  
    const url = await charge();
    res.redirect(url);
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})
const charge = async (item)=>{
  //const items = getCharges(id);
  const clientId = item.id;
  console.log("PAY",item);
  try {
    console.log("checkout");
  
    const lineItems = [{
            "price_data": {
                "currency": "usd", "product_data":
                    { "name": item.description },
                "unit_amount": item.amount * 100
            },
            "quantity": 1
    }];
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: lineItems,
      client_reference_id: item.id,
      success_url: `${process.env.CLIENT_URL}/success/${item.id}/2023`,
      cancel_url: `${process.env.CLIENT_URL}/cancel/${item.id}/2023`,
    })
    return { status: 1, url: session.url };
  } catch (e) {
    return {status: -1, url:"error"}
  }
}
app.post("/charge", async (req, res) => {
  try {
    console.log("BODY:", req.body);
    const dt = new Date();
    const id = dt.getTime();
    const item = {
      id: id,
      itemId: req.body.itemId,
      cliendId: req.body.cliendId,
      fullName: req.body.fullName,
      email: req.body.email,
      amount: parseInt(req.body.amount),
      description:"Donation",
      postDate: dt,
      status: 0,
      paid:null
    };
   
    console.log("TimeID:", id);
    const jsonData = JSON.stringify(item);
    console.log("ITEM:", item);
//    const storeItem = storeItems.get(1)
    const insert = "INSERT INTO charges(charge_id, item_id,client_id,email, full_name, json_data,description, amount,quantity,entered,paid,status,paid_by,token)VALUES";
    const values = `('${id}', ${item.itemId}, ${item.cliendId}, '${item.email}', '${item.fullName}', '${jsonData}', 'Donation', ${item.amount},1, SYSDATE(), 0, 0, '', '')`;
    console.log("INSERT", insert + values);
   // connection.query(insert + values);
    mongoInsert(item);
    const s = await charge(item);
    //console.log("STRIPE", s);
    if (s.status === 1000)
    {
      console.log("STRIPE", s.url);
      res.redirect(s.url);  
    }
    res.send({ status: 1, id:id,message: "charged posted", url:s.url });
  } catch (e) {
    console.log("Post error: ", e);
    res.send({ status: -1, id:0,message: "error posting...", errMsg: e });
  }

});
app.get("/dbtest", async (req, res) => {
  const results = connection.query('SELECT * FROM users');

  res.send(results);
});
app.get("/mycharges", async (req, res) => {
  const results = connection.query('SELECT * FROM charges');

  res.send(results);
});
app.get("/mongoTest", async (req, res) => {
  const charges = await getCharge(0);

  res.send(charges);
});
app.get("/success/:id/:token", async (req, res) => {
  const id = req.params.id;
  console.log("SUCCESS ", id);
  try {

    const obj = { status: 1, message: "paid", id: id }
    const update = `UPDATE charges SET paid = SYSDATE(), status = 1 WHERE charge_id = '${id}'`;
    console.log("UPDATE", update);
    //connection.query(update);
    const charge = await getCharge(parseInt(id));
    console.log("CHARGE:", charge);
    charge['status'] = 1;
    charge['paid'] = new Date().getTime();

    console.log("success:", obj);
    mongoUpate(charge);
    res.send(obj);
  } catch (e) {
    const obj = { status: -1, message: "error", id: id }
    res.send(obj);
  }

});
app.get("/cancel/:id/:token", async (req, res) => {
   const id = req.params.id;
  try {

    const obj = { status: 1, message: "paid", id: id }
    const update = `UPDATE charges SET paid = SYSDATE(), status = -1 WHERE charge_id = '${id}'`;
    console.log("UPDATE", update);
    connection.query(update);
    const charge = await getCharge(parseInt(id));
    console.log("CHARGE", charge);
    charge['status'] = 1;
    charge['paid'] = new Date().getTime();

    console.log("success:", obj);
    mongoUpate(charge);
    res.send(obj);
  } catch (e) {
    const obj = { status: -1, message: "error", id: id }
    res.send(obj);
  }
  
});
app.get("/chargeTest/:id/:name/:email", async (req, res) => {
  try {
    const dt = new Date();
    const id = dt.getTime();
    const itemId = req.params.id;
    const fn = req.params.name;
    const email = req.params.email;
    const item = {
      id: id,
      itemId: itemId,
      cliendId: 1,
      fullName: req.query.fn,
      email: req.query.email,
      quantity: 1,
      postDate: dt
    };

    console.log("Item:", item);
    const jsonData = JSON.stringify(item);
    console.log("ITEM:", item);
    const storeItem = storeItems.get(parseInt(item.itemId))
    const insert = "INSERT INTO charges(charge_id, item_id,client_id,email, full_name, json_data,description, amount,quantity,entered,paid,status,paid_by,token)VALUES";
    const values = `('${id}', ${item.itemId}, ${item.cliendId}, '${item.email}', '${item.fullName}', '${jsonData}', '${storeItem.name}', ${storeItem.priceInCents}, ${item.quantity}, SYSDATE(), 0, 0, '', '')`;
    console.log("INSERT", insert + values);
    connection.query(insert + values);
 //   mongoInsert(item);
    res.send({ status: 1, item:item, message: "charged posted" });
  } catch (e) {
    console.log("Post error: ", e);
    res.send({ status: -1, message: "error posting...", errMsg: e });
  }
});
const GC_MONGO_DOC = "donations";
const GC_MONGO_DB = "wkk";
const mongoInsert = async (obj) => {
  MongoClient.connect(GC_MONGO_URL, { useUnifiedTopology: true }, function (err, db) {
    if (err)
      throw err;
    var dbo = db.db(GC_MONGO_DB);

    dbo.collection(GC_MONGO_DOC).insertOne(obj);
    // 
  });
}
const mongoUpate = async (obj) => {
  console.log("mongoUpate:", obj);
  try {
    const db = await MongoClient.connect(GC_MONGO_URL, { useUnifiedTopology: true });
  
    var dbo = db.db(GC_MONGO_DB);
    //  dbo.collection.update({ 'id': obj.id }, { $set: { 'status': obj.status, paid: obj.paid } })
    const resp = await dbo.collection(GC_MONGO_DOC).updateOne({ "id": obj.id }, { $set: { "status": obj.status, paid: obj.paid } });
    console.log("Mongo Updated:", resp);
  } catch (e) {
    console.log("mongoUpate.error:", e);
  }
}
const getCharge = async (id) => {
  try {
    const query = id === 0 ? {} : { id: id };
    const db = await MongoClient.connect(GC_MONGO_URL, { useUnifiedTopology: true });
    console.log("GC_MONGO_URL", GC_MONGO_URL);
    var dbo = db.db(GC_MONGO_DB);
    const rows = await dbo.collection(GC_MONGO_DOC).find(query).toArray();
    console.log(id, "ROWS:", rows);
    if (rows)
      return id === 0 ? rows : rows[0];
    else
      return null;

  } catch (e) {
    console.log(e);
    return null;
  }
};
const loginMongo = async (un, pw) => {
  try {

    const query = { username: un }
    const db = await MongoClient.connect(GC_MONGO_URL, { useUnifiedTopology: true });
    var dbo = db.db("test");
    const rows = await dbo.collection("charges").find(query).toArray();
    console.log(id, "ROWS:", rows);
    if (rows && rows[0].password === pw) {
      return true;

    }
    else
      return false;

  } catch (e) {
    console.log(e);
    return false;
  }
};
/*
INSERT INTO `bank`.`charges`
(`id`,
`client_id`,
`description`,
`amount`,
`quantity`,
`entered`,
`paid`,
`status`,
`paid_by`,
`token`)
VALUES()



INSERT INTO`bank`.`charges`(`description`, `amount`, `quantity`, `entered`, `status`)
VALUES('Renatal Application Fee', 50, 1, SYSDATE(), 1);
*/
function getCharges(id) {
  try {
    const query = 'SELECT * FROM charges' + (id > 0 ? " WHERE charge_id = '" + id+"'" : "");
    console.log("GET CHARGES: ", query);
    const results = connection.query(query);
    console.log(results);

    return results;
  } catch (e) {
    return null;
  }
}
app.listen(port, () => {
  console.log("listening on port:", port);
})

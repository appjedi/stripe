require("dotenv").config()
const MySql = require('sync-mysql');
const GC_CONNECTIONS = [{
  host: 'localhost',
  user: 'root',
  database: 'bank',
  password: ''
},
{
  host: 'appdojo.net',
  user: 'appjedin_sensei',
  database: 'appjedin_training',
  password: 'Sensei2022!'
}];
const GC_CONN_IDX = 1;
var connection = new MySql(GC_CONNECTIONS[GC_CONN_IDX]);
const port = 3000;
const bodyParser = require('body-parser');
const express = require("express");
const app = express();
const cors = require("cors");
app.use(express.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY)
//console.log("STRIPE KEY", process.env.STRIPE_PRIVATE_KEY)
const mongodb = require('mongodb');
const MongoClient = require('mongodb').MongoClient;
const GC_MONGO_URL = "mongodb+srv://appuser:AppData2022@cluster0.aga82.mongodb.net/test";
const storeItems = new Map([
  [1, { priceInCents: 20, name: "Intro to JavaScript" }],
  [2, { priceInCents: 50, name: "Learn React Today" }],
  [3, { priceInCents: 20, name: "Learn CSS Today" }],
])
app.get("/release", (req, res) => {
  res.send("2022-08-27");
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
      success_url: `${process.env.CLIENT_URL}/success`,
      cancel_url: `${process.env.CLIENT_URL}/cancel`,
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
  const items = getCharges(req.params.id);
  const clientId = req.params.id;
  console.log(items);
  try {
    console.log("checkout");
    const lineItems = items.map(item => {
      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: item.description,
          },
          unit_amount: parseInt(item.amount) * 100,
        },
        quantity: item.quantity

      }
    });
    console.log("lineItems:", lineItems);
    const test = [{
      "price_data": {
        "currency": "usd", "product_data":
          { "name": items[0].description },
        "unit_amount": parseInt(items[0].amount) * 100
      },
      "quantity": parseInt(items[0].quantity)
    }];

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: lineItems,
      client_reference_id: items[0].charge_id,
      success_url: `${process.env.CLIENT_URL}/success/${items[0].charge_id}/123`,
      cancel_url: `${process.env.CLIENT_URL}/cancel?id=${items[0].charge_id}`,
    })
    //res.redirect(session.url);
    res.send(s);
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})
app.get("/dbtest", async (req, res) => {
  const results = connection.query('SELECT * FROM users');

  res.send(results);
});
app.get("/mycharges", async (req, res) => {
  const results = connection.query('SELECT * FROM charges');

  res.send(results);
});
app.get("/success/:id/:token", async (req, res) => {
  const id = req.params.id;
  try {

    const obj = { status: 1, message: "paid", id: id }
    const update = `UPDATE charges SET paid = SYSDATE(), status=1 WHERE charge_id= '${id}'`;
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
app.get("/cancel", async (req, res) => {
  console.log(req);
  res.send(req);
});
app.get("/chargeTest", async (req, res) => {
  try {
    const dt = new Date();
    const id = dt.getTime();
    const item = {
      id: id,
      itemId: req.query.itemId,
      cliendId: 1,
      fullName: req.query.fn,
      email: req.query.email,
      quantity: 1,
      postDate: dt
    };

    console.log("TimeID:", id);
    const jsonData = JSON.stringify(item);
    console.log("ITEM:", item);
    const storeItem = storeItems.get(parseInt(item.itemId))
    const insert = "INSERT INTO charges(charge_id, item_id,client_id,email, full_name, json_data,description, amount,quantity,entered,paid,status,paid_by,token)VALUES";
    const values = `('${id}', ${item.itemId}, ${item.cliendId}, '${item.email}', '${item.fullName}','${jsonData}', '${storeItem.name}', ${storeItem.priceInCents}, ${item.quantity},SYSDATE(),0,0,'','')`;
    console.log("INSERT", insert + values);
    connection.query(insert + values);
    mongoInsert(item);
    res.send({ status: 1, message: "charged posted" });
  } catch (e) {
    console.log("Post error: ", e);
    res.send({ status: -1, message: "error posting...", errMsg: e });
  }
});
app.post("/charge", async (req, res) => {
  try {
    const dt = new Date();
    const id = dt.getTime();
    const item = {
      id: id,
      itemId: req.body.itemId,
      cliendId: req.body.cliendId,
      fullName: req.body.fullName,
      email: req.body.email,
      amount: req.body.amount,
      postDate: dt,
      status:0
    };

    console.log("TimeID:", id);
    const jsonData = JSON.stringify(item);
    console.log("ITEM:", item);
    const storeItem = storeItems.get(parseInt(item.itemId))
    const insert = "INSERT INTO charges(charge_id, item_id,client_id,email, full_name, json_data,description, amount,quantity,entered,paid,status,paid_by,token)VALUES";
    const values = `('${id}', ${item.itemId}, ${item.cliendId}, '${item.email}', '${item.fullName}','${jsonData}', '${storeItem.name}', ${storeItem.priceInCents}, ${item.quantity},SYSDATE(),0,0,'','')`;
    console.log("INSERT", insert + values);
    connection.query(insert + values);
    mongoInsert(item);
    res.send({ status: 1, message: "charged posted" });
  } catch (e) {
    console.log("Post error: ", e);
    res.send({ status: -1, message: "error posting...", errMsg: e });
  }

});
const mongoInsert = async (obj) => {
  MongoClient.connect(GC_MONGO_URL, { useUnifiedTopology: true }, function (err, db) {
    if (err)
      throw err;
    var dbo = db.db("test");

    dbo.collection("charges").insertOne(obj);

  });
}
const mongoUpate = async (obj) => {
  MongoClient.connect(GC_MONGO_URL, { useUnifiedTopology: true }, function (err, db) {
    if (err)
      throw err;
    var dbo = db.db("test");
    //  dbo.collection.update({ 'id': obj.id }, { $set: { 'status': obj.status, paid: obj.paid } })
    dbo.collection("charges").updateOne({ 'id': obj.id }, { $set: { 'status': obj.status, paid: obj.paid } });

  });
}
const getCharge = async (id) => {
  try {

    const query = id === 0 ? {} : { id: id };
    const db = await MongoClient.connect(GC_MONGO_URL, { useUnifiedTopology: true });
    var dbo = db.db("test");
    const rows = await dbo.collection("charges").find(query).toArray();
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
    const results = connection.query('SELECT * FROM charges WHERE id=' + id);
    console.log(results);

    return results;
  } catch (e) {
    return null;
  }
}
app.listen(port, () => {
  console.log("listening on port:", port);
})

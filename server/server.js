require("dotenv").config()
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');


 const sequelize = new Sequelize(
            "dev",
            "root",
            "Jedi2023",
            {
                host: "127.0.0.1",
                dialect: "mysql"
            }
        );
const query=async(query, values)=> {
        const results = await sequelize.query(query, {
            replacements: values, type: sequelize.QueryTypes.SELECT
        });
        console.log(results);
        return results;
    }
const execute=async(query, values)=> {
        const results = await sequelize.query(query, {
            replacements: values
        });
        return results;
}

const port = 8080;
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

const GC_PUBLIC_DIR = path.join(__dirname + '/public/index.html').split("/index.html")[0];


let ssn;
const GC_RELEASE = "2023-12-21";
app.get("/", (req, res) => {
  ssn = req.session;
  res.send(GC_RELEASE);
});
app.get("/release", (req, res) => {
  ssn = req.session;
  res.send(GC_RELEASE);
});
app.get("/stripe", (req, res) => {
  res.sendFile(path.join(__dirname + '/public/stripe.html'));
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
  const auth =await login(username, password);
  if (auth) {
    ssn = req.session;
    ssn.user = auth;
  }
  res.send({ auth: auth });
});

app.post("/charge", async (req, res) => {
  console.log("charge",req.body);
  res.json({ status:1, message: "done", body:req.body });
})
async function login(u, p) {
  try {
    const select = `SELECT * FROM users WHERE username=? AND password= ?`;
    console.log("LOGIN:", select);
    const results = await query(select, [u,p]);
    console.log(results);

    return results;
  } catch (e) {
    console.log("ERROR:", e);
    return null;
  }
}

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
app.get("/dbtest", async (req, res) => {
  console.log("dbtest");
  const results = await query('SELECT * FROM users');

  res.send(results);
});

app.listen(port, () => {
  console.log("listening on port:", port);
});

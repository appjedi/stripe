// source: https://www.youtube.com/watch?v=z84uTk5zmak
import dotenv from 'dotenv'
import Koa from 'koa';
import { Context, DefaultState } from 'koa';
//import KoaRouter from 'koa-router';
import * as Router from "koa-router";

import json from 'koa-json';
import render from 'koa-ejs';
import bodyParser from 'koa-bodyparser';
import path from 'path';
import session from 'koa-session';
import Service from './services/service';

dotenv.config();

const app = new Koa();
const router = new Router();
const PORT = 3000;
//app.use(session());
app.keys = ['Shh, its a secret!'];
app.use(session(null, app));
app.use(json(null));
app.use(bodyParser());
const GC_RELEASE = "2023-12-12";
// 
//const dao = new MainDAO(process.env.MONGO_DEV_URL);
//const myConn = JSON.parse(process.env.MYSQL_DEV);
const service = new Service(process.env.MONGO_DEV_URL ?? "");

//const myDao = new MyDAO(myConn)
let ssn;
const GC_STUDENTS = [];
const GC_LEVELS = ['None', 'White', 'Yellow', 'Orange', 'Green', 'Blue', 'Purple', 'Brown 3rd', 'Brown 2nd', 'Brown 1st', 'Shodan', 'Nidan', 'Sandan'];
const GC_MONGO_DB_NAME = "wkk";
// 

console.log("DIRNAME", path.resolve());
const GC_DIRNAME = path.resolve();
const __dirname = GC_DIRNAME + "/";
const GC_SERVER_URL = process.env.SERVER_URL;
render(app, {
  root: path.join(__dirname, 'views'),
  layout: 'layout',
  viewExt: 'html',
  cache: false,
  debug: false
});
app.use(router.routes);
//.use(router.allowedMethods(null));

router.get("/", async (ctx: Context, next) => {
  await ctx.render('stripe', { serverURL: GC_SERVER_URL });
});
router.get("/donate", async (ctx: Context) => {
  await ctx.render('stripe', { serverURL: GC_SERVER_URL });
});
//  
router.get("/key/:key/:val", async (ctx) => {
  const key = ctx.params.key;
  const val = ctx.params.val;
  let rv;
  if (val === "get") {
    rv = await service.getKeyValue(key)
  } else {
    rv = await service.addKeyValue(key, val);
  }

  ctx.body = rv;
});
router.get("/health", async (ctx) => {
  ctx.body = { status: 200, release: GC_RELEASE, message: "I'm alive" };
});
router.get("/mytest/:msg", async (ctx) => {
  const msg = ctx.params.msg;
  //const users = await myDao.query("SELECT * FROM users");
  const resp = await service.execute("call usp_logger(?);", [msg])
  ctx.body = resp;
})
router.get("/hello/:name", async (ctx) => {
  ctx.body = "Hello " + ctx.params.name;
});

router.get("/user", async (ctx: Context) => {
  try {
    ctx.body = ctx.session ? ctx.session["user"] : "";
  } catch (e) {

  }
});
router.get("/products", async (ctx: Context) => {

  const products = await service.getProducts();
  console.log("products:", products);
  await ctx.render('products', {
    products: products,
    serverURL: GC_SERVER_URL
  });
});
router.post("/api/checkout", async (ctx: Context) => {
  console.log("checkout:", ctx.request.body);
  const data = ctx.request.body ?? {}
  const resp = await service.purchase(data);
  ctx.body = resp;
});
router.get("/api/products", async (ctx: Context) => {
  const products = await service.getProducts();
  console.log("products:", products);
  ctx.body = products;
});
router.post("/charge", async (ctx: Context) => {
  try {
    console.log("charge:", ctx.request.body);
    if (!ctx.request.body) {
      ctx.body = {
        status: -1, id: 0, message: "error posting...", errMsg: "data missing"
      };
      return;
    }
    const data = ctx.request.body ?? { email: "", fullName: "", amount: 0 };
    const resp = await service.charge(data["email"], ctx.request.body["fullName"], ctx.request.body["amount"]);
    // charge (email,fullName,email)
    ctx.body = resp;
  } catch (e) {
    console.log("Post error: ", e);
    ctx.body = { status: -1, id: 0, message: "error posting...", errMsg: e };
  }
});
router.get("/success/:id/:token", async (ctx: Context) => {
  const id = ctx.params.id;
  console.log("SUCCESS ", id);
  try {

    const obj = { status: 1, message: "Thank you for your donation!", id: id }
    service.updateFromStripe(parseInt(id), 1);

    console.log("success:", obj);

    await ctx.render('confirm', { obj: obj })
  } catch (e) {
    const obj = { status: -1, message: "error", id: id }
    ctx.body = obj;
  }

});
router.get("/cancel/:id/:token", async (ctx: Context) => {
  const id = ctx.params.id;
  try {
    const obj = { status: 1, message: "paid", id: id }
    service.updateFromStripe(parseInt(id), -1);

    console.log("cancel:", obj);

    ctx.render("confirm", { obj: obj })
  } catch (e) {
    const obj = { status: -1, message: "error", id: id }
    ctx.body = obj;
  }
});
router.get('/login', (ctx) => {
  const msg = ctx.query.msg || "enter your credentials";
  const form = `
    <html><head><title>login</title></head><body>
   <h1>Login Page: </h1><p>${msg}</p>
   <form method="POST" action="login">
    Username:<br><input type="text" name="username">
    <br>Password:<br><input type="password" name="password">
    <br><br><input type="submit" value="Submit"></form></body></html>
    `;

  ctx.body = form;

});
router.post('/login', async (ctx: Context) => {
  const data = ctx.request.body ?? { username: "missing", password: "missing" };
  const username = data["username"];
  const password = data["password"];
  console.log("/login:", username);
  const auth = await service.login(username, password);
  console.log("Authenticated!", auth);
  if (auth && auth["id"] > 0) {
    console.log("Authenticated!", auth);
    const obj = { auth: true, userId: auth["id"], userName: auth["username"], roleId: auth["role_id"] };
    console.log("AUTH:", obj);
    ssn = ctx.session;

    //this.session.user = auth;
    ssn.user = auth;
    // console.log("SESSION", ssn);
    ctx.redirect("/");
  } else {
    // ctx.body={auth:false};
    ctx.redirect("/login?msg=Invalid Login")
  }
});


app.listen(PORT, () => {
  console.log("listening on port:", PORT);
})


// source: https://www.youtube.com/watch?v=z84uTk5zmak
require("dotenv").config()

const Koa = require('koa');
const KoaRouter = require('koa-router');
const json = require('koa-json');
const render = require('koa-ejs');
const bodyParser = require('koa-bodyparser');
const path = require('path');
const session = require('koa-session');
const MainDAO = require("./dao/DAOClass.js");
const {charge} = require('./services/stripe.mjs')
// 
const app = new Koa();
const router = new KoaRouter();
const PORT = 3000;
//app.use(session());
app.keys = ['Shh, its a secret!'];
app.use(session(app)); 
app.use(json());
app.use(bodyParser());
const GC_RELEASE = "2023-07-16";
// 
const dao = new MainDAO(process.env.MONGO_URL);

let ssn;
const GC_STUDENTS = [];
const GC_LEVELS = ['None', 'White', 'Yellow', 'Orange', 'Green', 'Blue', 'Purple', 'Brown 3rd', 'Brown 2nd', 'Brown 1st', 'Shodan', 'Nidan', 'Sandan'];
const GC_MONGO_DB_NAME = "wkk";
// 
render(app, {
    root: path.join(__dirname, 'views'),
    layout: 'layout',
    viewExt: 'html',
    cache: false,
    debug:false
});
app.use(router.routes()).use(router.allowedMethods());

router.get("/", async (ctx) => {
});
//  
router.get("/add", async (ctx) => {
  await ctx.render('add');
});
router.get("/release", async (ctx) => {
   ctx.body=GC_RELEASE;
});

router.get("/hello/:name", async (ctx) => {
    ctx.body = "Hello " + ctx.params.name;
});

router.get("/user", async (ctx) => {
    ctx.body = ctx.session.user;
});
router.get('/login', (ctx) => {
  const msg = ctx.query.msg;
  const form =
    `
    <html><head><title>login</title></head><body>
   <h1>Login Page: </h1><p>${msg}</p>
   <form method="POST" action="login">
    Username:<br><input type="text" name="username">
    <br>Password:<br><input type="password" name="password">
    <br><br><input type="submit" value="Submit"></form></body></html>
    `;

  ctx.body=form;

});
router.post("/charge", async (ctx) => {
try {
    console.log("BODY:", req.body);
    const resp =await charge(ctx.request.body.email, ctx.request.body.fullName, ctx.request.body.amount);
   
    
    ctx.body = resp;
  } catch (e) {
    console.log("Post error: ", e);
    ctx.body ={ status: -1, id:0,message: "error posting...", errMsg: e };
  }
});
router.get("/success/:id/:token", async (ctx) => {
  const id = ctx.params.id;
  console.log("SUCCESS ", id);
  try {

    const obj = { status: 1, message: "paid", id: id }
      dao.updateFromStripe(id, 1);

    console.log("success:", obj);
   
      ctx.render("confirm", {obj:obj})
  } catch (e) {
    const obj = { status: -1, message: "error", id: id }
    res.send(obj);
  }

});
router.get("/cancel/:id/:token", async (ctx) => {
    const id = ctx.params.id;
    try {

        const obj = { status: 1, message: "paid", id: id }
        dao.updateFromStripe(id, -1);

        console.log("cancel:", obj);
    
        ctx.render("confirm", {obj:obj})
    } catch (e) {
        const obj = { status: -1, message: "error", id: id }
        res.send(obj);
    }
});
router.post('/login', async (ctx) => {
  const username = ctx.request.body.username;
  const password = ctx.request.body.password;
  console.log("/login:", username);
  const auth = await dao.dbAuth(username, password);
   console.log("Authenticated!",auth);
  if (auth && auth.id>0)
  {
    console.log("Authenticated!",auth);
          const obj = { auth: true, userId: auth.id, userName: auth.username, roleId: auth.role_id };
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


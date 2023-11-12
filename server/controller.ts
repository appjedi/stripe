import { Context } from "koa";
//import dotenv from "dotenv";

import Service from "./services/service";

let ssn: any;
class Controller {
  private service: Service;
  private GC_SERVER_URL: string;
  private GC_RELEASE: string;
  constructor() {
    this.service = new Service(process.env.MONGO_DEV_URL ?? "");
    this.GC_SERVER_URL = process.env.SERVER_URL + "";
    this.GC_RELEASE = "2023-11-11";
  }
  getValue = async (ctx: Context): Promise<void> => {
    const key = ctx.params.key;
    const val = ctx.params.val;
    let rv: any;
    if (val === "get") {
      rv = await this.service.getKeyValue(key);
    } else {
      rv = await this.service.addKeyValue(key, val);
    }
    ctx.body = rv;
  };
  queryPage = async (ctx: Context) => {
    await ctx.render("query", { serverURL: this.GC_SERVER_URL });
  };
  query = async (ctx: Context) => {
    const q = ctx.params.q;
    console.log("QUERY:", q);
    const resp = await this.service.query(q, []);
    console.log("RESP", resp);
    ctx.body = resp;
  };
  getVideos = async (ctx: Context) => {
    const videos = await this.service.getVideos();
    //ctx.body = videos;
    await ctx.render("videos", { videos: videos });
  };
  postVideo = async (ctx: Context) => {
    const data = ctx.request.body;
    const resp = await this.service.saveVideo(data);
    //const videos = await this.service.getVideos();
    //ctx.body = videos;
    ctx.body = resp;
  };
  productsForm = async (ctx: Context) => {
    const products = await this.service.getProducts();
    console.log("products:", products);
    await ctx.render("products", {
      products: products,
      serverURL: this.GC_SERVER_URL,
    });
  };
  checkout = async (ctx: Context) => {
    console.log("checkout:", ctx.request.body);
    const data = ctx.request.body ?? {};
    const resp = await this.service.purchase(data);
    ctx.body = resp;
  };
  getProducts = async (ctx: Context) => {
    const products = await this.service.getProducts();
    console.log("products:", products);
    ctx.body = products;
  };
  charge = async (ctx: Context) => {
    try {
      if (!ctx.request.body) {
        ctx.body = {
          status: -1,
          id: 0,
          message: "error posting...",
          errMsg: "data missing",
        };
        return;
      }
      const amt = parseInt(ctx.request.body["amount"]);

      const data = ctx.request.body ?? { email: "", fullName: "", amount: amt };
      console.log("server.charge:", amt, data);

      const resp = await this.service.charge(
        data["email"],
        data["fullName"],
        amt
      );
      // charge (email,fullName,email)
      console.log("RESP", resp);
      ctx.body = resp;
    } catch (e) {
      console.log("Post error: ", e);
      ctx.body = { status: -1, id: 0, message: "error posting...", errMsg: e };
    }
  };
  chargeSuccess = async (ctx: Context) => {
    const id = ctx.params.id;
    console.log("SUCCESS ", id);
    try {
      const obj = {
        status: 1,
        message: "Thank you for your payment!",
        id: id,
      };
      this.service.updateFromStripe(parseInt(id), 1);

      console.log("success:", obj);

      await ctx.render("confirm", { obj: obj });
    } catch (e) {
      const obj = { status: -1, message: "error", id: id };
      ctx.body = obj;
    }
  };
  chargeCancel = async (ctx: Context) => {
    const id = ctx.params.id;
    try {
      const obj = { status: 1, message: "paid", id: id };
      this.service.updateFromStripe(parseInt(id), -1);

      console.log("cancel:", obj);

      ctx.render("confirm", { obj: obj });
    } catch (e) {
      const obj = { status: -1, message: "error", id: id };
      ctx.body = obj;
    }
  };
  getLoginPage = (ctx: Context) => {
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
  };
  postLogin = async (ctx: Context) => {
    const data = ctx.request.body ?? {
      username: "missing",
      password: "missing",
    };
    const username = data["username"];
    const password = data["password"];
    console.log("/login:", username);
    const auth = await this.service.login(username, password);
    console.log("Authenticated!", auth);
    if (auth && auth["id"] > 0) {
      console.log("Authenticated!", auth);
      const obj = {
        auth: true,
        userId: auth["id"],
        userName: auth["username"],
        roleId: auth["role_id"],
      };
      console.log("AUTH:", obj);
      ssn = ctx.session;

      //this.session.user = auth;
      ssn.user = auth;
      // console.log("SESSION", ssn);
      ctx.redirect("/");
    } else {
      // ctx.body={auth:false};
      ctx.redirect("/login?msg=Invalid Login");
    }
  };
  getStudents = async (ctx: Context) => {
    const students = await this.service.getStudents(0);
    console.log("controller.getStudetns");

    ctx.body = students;
  };
  getStudentsPage = async (ctx: Context) => {
    ssn = ctx.session;
    if (!ssn || !ssn["user"]) {
      ctx.redirect("/login?msg=Please login");
      return;
    }
    const s = (await this.service.getStudents(0)) ?? [{ rank: 0, name: "" }];

    // console.log("STUDENTS:", s);
    s.sort((a, b) => {
      const diff = b.rank - a.rank;
      if (diff !== 0) {
        return diff;
      }
      return b.name > a.name ? -1 : 1;
    });
    console.log("STUDENTS:", s);
    await ctx.render("students", {
      students: s,
      levels: Service.getLevels(),
    });
  };
  postStudent = async (ctx: Context) => {
    const s = ctx.request.body;
    console.log("POST STUDENT:", s);
    const resp = await this.service.createStudent(s);
    console.log("RESP", resp);
    ctx.body = resp;
  };
  postAttendance = async (ctx: Context) => {
    const s = ctx.request.body;
    console.log("attendance:", s);
    //const resp = await service.updateStudent(s);
    const resp = await this.service.postAttendance(s);
    //const resp = { status: 1, message: "done" };
    console.log("RESP", resp);
    ctx.body = resp;
  };
  putStudent = async (ctx: Context) => {
    const s = ctx.request.body;
    console.log("PUT", s);
    const resp = await this.service.updateStudent(s);
    ctx.body = resp;
  };
  sendMail = async (ctx: Context) => {
    const mailOptions = {
      from: "",
      to: ctx.params.to,
      subject: ctx.params.subject,
      html: ctx.params.message,
    };
    const resp = await this.service.sendMail(mailOptions);
    //service.sendMail(ctx.params.to, ctx.params.subject, ctx.params.message);
    ctx.body = resp;
  };
}
export { Controller };

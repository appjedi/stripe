import Router from "koa-router";
import { Context } from "koa";
import dotenv from "dotenv";
import { Controller } from "./controller";
//import Service from "./services/service";
//import winston from "winston";
/*

*/
const router = new Router();
dotenv.config();
const controller = new Controller();
//const service = new Service(process.env.MONGO_DEV_URL ?? "");
const GC_SERVER_URL = process.env.SERVER_URL;
const GC_RELEASE = "2023-10-11";
let ssn: any;
router.get("/", async (ctx: Context, next) => {
  await ctx.render("stripe", { serverURL: GC_SERVER_URL });
});
router.get("/donate", async (ctx: Context) => {
  await ctx.render("stripe", { serverURL: GC_SERVER_URL });
});
router.get("/health", async (ctx: Context) => {
  ctx.body = { status: 200, release: GC_RELEASE, message: "I'm alive" };
});
router.get("/hello/:name", async (ctx: Context) => {
  ctx.body = "Hello " + ctx.params.name;
});
router.get("/user", async (ctx: Context) => {
  try {
    ctx.body = ctx.session ? ctx.session["user"] : "";
  } catch (e) { }
});

router.get("/key/:key/:val", controller.getValue);
router.get("/query", controller.queryPage);
router.get("/api/query/:q", controller.query);
router.get("/videos", controller.getVideos);
router.post("/video", controller.postVideo);
router.get("/products", controller.productsForm);
router.post("/api/checkout", controller.checkout);
router.get("/api/products", controller.getProducts);
router.post("/charge", controller.charge);
router.get("/email/:to/:subject/:message", controller.sendMail);
router.get("/success/:id/:token", controller.chargeSuccess);
router.get("/cancel/:id/:token", controller.chargeCancel);
router.get("/login", controller.getLoginPage);
router.post("/login", controller.postLogin);
router.get("/api/students", controller.getStudents);
router.get("/students", controller.getStudentsPage);
router.post("/student", controller.postStudent);
router.post("/attendance", controller.postAttendance);
router.put("/student", controller.putStudent);

export { router };

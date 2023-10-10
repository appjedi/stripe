// source: https://www.youtube.com/watch?v=z84uTk5zmak
import Koa from "koa";
import { Context, DefaultState } from "koa";
import { router } from "./router";

import json from "koa-json";
import render from "koa-ejs";
import bodyParser from "koa-bodyparser";
import path from "path";
import session from "koa-session";

//import Service from "./services/service";
import winston from "winston";

const app = new Koa();
//const router = new Router();
const PORT = 3000;
//app.use(session());
app.keys = ["Shh, its a secret!"];
app.use(session(null, app));
app.use(json(null));
app.use(bodyParser());
const logConfigurationConsole = {
  transports: [new winston.transports.Console()],
};
const logConfiguration = {
  transports: [
    new winston.transports.File({
      filename: "logs/example.log",
    }),
  ],
};
const logger = winston.createLogger(logConfiguration);

const GC_RELEASE = "2023-10-10";

//const service = new Service(process.env.MONGO_DEV_URL ?? "");

let ssn;
const GC_STUDENTS = [];

const GC_MONGO_DB_NAME = "wkk";
//

console.log("DIRNAME", path.resolve());
const GC_DIRNAME = path.resolve();
//const __dirname = GC_DIRNAME + "/";
const GC_SERVER_URL = process.env.SERVER_URL;
render(app, {
  root: path.join(__dirname, "views"),
  layout: "layout",
  viewExt: "html",
  cache: false,
  debug: false,
});
app.use(router.routes());
//.use(router.allowedMethods(null));

app.listen(PORT, () => {
  logger.log({ message: "started with winston", level: "info" });
  console.log("TS-listening on port:", PORT);
});

export { app };

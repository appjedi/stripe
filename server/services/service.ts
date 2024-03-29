import MainDAO from "../dao/MainDAO";
import MyDAO from "../dao/MyDAO";
import Charge from "./stripe";
import nodeMailer from "nodemailer";
import { IMailAuth, ICart, IItem, IPurchase } from "../dao/Interfaces";
import winston from "winston";

const GC_PRODUCTS = [
  { id: 1, name: "Patch", description: "Patch", price: 15, qty: 0 },
  {
    id: 2,
    name: "Gi with Patch",
    description: "Gi with Patch",
    price: 30,
    qty: 0,
  },
  {
    id: 3,
    name: "Promotion Fee",
    description: "Promotion Fee",
    price: 30,
    qty: 0,
  },
  {
    id: 4,
    name: "Donation",
    description:
      "Wado Ki Kai is a 501(c)3 non profit.  Your donation is tax deductible.\n Quantity is the dollar amount, i.e. Quantity 10 is $10 donation",
    price: 1,
    qty: 0,
  },
];
const GC_LEVELS = [
  "None",
  "White",
  "Yellow",
  "Orange",
  "Green",
  "Blue",
  "Purple",
  "Brown 3rd",
  "Brown 2nd",
  "Brown 1st",
  "Shodan",
  "Nidan",
  "Sandan",
];
class KeyValue {
  public key: String;
  public value: String;
  constructor(key: String, value: String) {
    this.key = key;
    this.value = value;
  }
}
class Service {
  private mainDAO: MainDAO;
  private dao: MyDAO;
  private keyValues: Array<KeyValue>;
  private mailAuth: IMailAuth;
  constructor(mongoURL: string) {
    console.log("mongoLink:", mongoURL);
    this.mainDAO = new MainDAO(mongoURL);
    this.init();
  }
  init = async () => {
    try {
      console.log("init");
      const keyValues = await this.getKeyValues();
      this.keyValues = keyValues;
      //   console.log("keyValues", this.keyValues);
      const myConn = this.getKeyValueLocal("MySQL_CONN", "");
      //const myConn ='{"host":"appdojo.net","user":"appjedin_dba","database":"appjedin_wkk_prod","password":"$Data2022", "dialect":"mysql"}';
      const myConnDev =
        '{"host":"127.0.0.1","user":"root","database":"dev","password":"Jedi2023","dialect":"mysql"}';
      console.log("myConn", myConn);
      this.dao = new MyDAO(JSON.parse(myConn + ""));
      let temp = this.getKeyValueLocal("MAIL_OPTIONS", "");
      console.log("MAIL_OPTIONS:", temp);
      let obj = JSON.parse(temp + "");
      //console.log("MAIL_OPTIONS:", JSON.stringify(obj));
      this.mailAuth = <IMailAuth>obj;
      //console.log("mailAuth", this.mailAuth);
      //this.stripe = new Stripe();
    } catch (e) {
      console.log("Init error:", e);
    }
  };
  static getLevels = () => {
    return GC_LEVELS;
  };
  getProducts = async () => {
    return GC_PRODUCTS;
  };
  getProduct = (id: number) => {
    for (let prod of GC_PRODUCTS) {
      if (prod.id === id) {
        return prod;
      }
    }
    return null;
  };
  getKeyValueLocal = (key: string, alt: string): string => {
    for (let kv of this.keyValues) {
      if (kv.key === key) {
        return kv.value + "";
      }
    }
    return alt;
  };
  getKeyValue = async (key: string): Promise<String> => {
    try {
      console.log("service.getKeyValue:", key);
      const val = await this.mainDAO.getKeyValue(key);
      return val;
    } catch (e) {
      return "error";
    }
  };
  addKeyValue = async (key: string, value: string) => {};
  getKeyValues = async (): Promise<Array<KeyValue>> => {
    try {
      //const rows: Array<KeyValue>=new Array<KeyValue>();
      const rows = await this.mainDAO.getKeyValues();
      //   console.log("getKeyValues:", rows);
      return rows;
    } catch (e) {
      return [{ key: "ERR", value: "error" }];
    }
  };
  getVideos = async (): Promise<Array<Object>> => {
    try {
      const results = await this.dao.query("SELECT * FROM view_videos ", []);
      //   console.log("getVideos", results);
      return results;
    } catch (e) {
      return [{ status: -1, message: "error" }];
    }
  };
  getVideosFromMongo = async (id: any) => {
    try {
      const videos = await this.mainDAO.getVideos(id);
      return videos;
    } catch (e) {
      return { status: -1, message: "error" };
    }
  };
  saveVideo = async (data: any) => {
    try {
      console.log("console", data);
      //  usp_video_save (0,'test.com', '2023-08-01','TITLE','source',1,1,1,1,1,1,1)
      const sp = "call usp_video_save (?,?,?,?,?,?,?,?,?,?,?,?)";
      const values = [
        data["id"],
        data["url"],
        data["videoDate"],
        data["title"],
        "src",
        data["hostedBy"],
        data["categoryId"],
        data["sectionId"],
        data["eventId"],
        data["status"],
        data["sortOrder"],
        data["reorder"],
      ];
      console.log("values", values);
      const result = this.dao.execute(sp, values);
      console.log("result", result);
      return result;
    } catch (e) {
      return { status: -1, message: "error" };
    }
  };
  execute = async (query: string, values: Array<Object>) => {
    try {
      const result = await this.dao.execute(query, values);
      console.log("result", result);
      return result;
    } catch (e) {
      return { status: -1, message: "error" };
    }
  };
  getUsers = async (id: any) => {
    if (id) {
      const user = await this.mainDAO.getUserById(id);
      return user;
    } else {
      const users = await this.mainDAO.getUsers();
      return users;
    }
  };
  getStudents = async (id: number) => {
    try {
      const rows = await this.mainDAO.getStudents(id);
      const students = [];

      console.log(id, "ROWS:", rows);
      if (rows != null) return id === 0 ? rows : rows[0];
      else return null;
    } catch (e) {
      console.log(e);
      return null;
    }
  };
  purchase = async (data: Object): Promise<Object> => {
    const cart: ICart = {
      customerId: data["customerId"],
      email: data["email"],
      fullName: data["fullName"],
      cart: data["cart"],
    };
    const errors: any = [];
    if (cart.email === "") {
      errors.push({ field: "email", message: "email missing or invalid" });
    }
    if (cart.fullName === "") {
      errors.push({
        field: "fullName",
        message: "Full Name missing or invalid",
      });
    }
    if (errors.length > 0) {
      return { status: -1, message: "missing or invalid data", errors: errors };
    }
    const resp: Object = await this.mainDAO.addPurchase(cart);
    console.log("MainDAO.RESP", resp);
    const resp2 = await Charge.charge(
      this.mainDAO,
      resp["productId"],
      resp["amount"],
      "purchase"
    ); //dao, id, amount, name
    console.log("STRIPE:", resp2);
    return resp2;
  };
  charge = async (
    email: string,
    fullName: string,
    amount: number,
    description: string = ""
  ) => {
    const item: IItem = {
      productId: 1,
      quantity: 1,
      price: amount,
      description: description,
    };
    console.log("service.charge:", item);
    const items: Array<IItem> = [item];

    const cart: ICart = {
      customerId: 1,
      email: email,
      fullName: fullName,
      cart: items,
    };
    const resp: Object = await this.mainDAO.addPurchase(cart);
    console.log("MainDAO.RESP", resp);
    const resp2 = await Charge.charge(
      this.mainDAO,
      resp["productId"],
      resp["amount"],
      "purchase"
    ); //dao, id, amount, name
    console.log("STRIPE:", resp2);
    return resp2;
  };

  chargeByID = async (id: number) => {
    const charge = await this.dao.getCharge(id);
    const item: IItem = {
      productId: charge["productId"],
      quantity: charge["quantity"],
      price: charge["amount"],
      description: charge["description"],
    };
    console.log("service.charge:", item);
    const items: Array<IItem> = [item];

    const cart: ICart = {
      customerId: 1,
      email: charge["email"],
      fullName: charge["fullName"],
      cart: items,
    };
    //const resp: Object = await this.mainDAO.addPurchase(cart);
    //console.log("MainDAO.RESP", resp);
    const resp = await Charge.charge(
      this.mainDAO,
      charge["productId"],
      charge["amount"],
      "purchase"
    ); //dao, id, amount, name
    console.log("STRIPE:", resp);
    return resp;
  };
  postAttendance = async (list) => {
    const msg = await this.mainDAO.postAttendance(list);
    return msg;
  };
  createStudent = async (student: any) => {
    return this.mainDAO.createStudent(student);
  };
  updateStudent = async (student) => {
    return this.mainDAO.updateStudent(student);
  };
  query = async (query: string, values: Array<Object>) => {
    try {
      const result = await this.dao.query(query, values);
      console.log("result", result);
      return result;
    } catch (e) {
      return { status: -1, message: "error" };
    }
  };
  logger = async (msg: string, src: number) => {
    try {
      const sp = "ups_logger(?,?)";
      const values = [msg, src];
      const resp = await this.query(sp, values);
      return resp;
    } catch (e) {
      return { status: -1, message: "error" };
    }
  };
  login = async (user: string, pass: string): Promise<Object> => {
    try {
      console.log("service.login:", user);
      const resp = await this.mainDAO.dbAuth(user, pass);
      return resp;
    } catch (e) {
      console.log("login error:", e);
      return { status: -1, message: "error loggin in" };
    }
  };
  updateFromStripe = async (id: number, status: number) => {
    const resp = await this.mainDAO.updateFromStripe(id, status);
    return resp;
  };
  // {"from":"App Jedi <appjedi.net@gmail.com>","user":"appjedi.net@gmail.com","pass":"dekxwtulmsryovls","port":"465","host":"smtp.gmail.com"}
  sendMail = async (mailOptions: any) => {
    try {
      const transporter = nodeMailer.createTransport({
        host: this.mailAuth.host,
        port: this.mailAuth.port,
        auth: {
          user: this.mailAuth.user,
          pass: this.mailAuth.pass,
        },
      });
      mailOptions.from = this.mailAuth.from;
      console.log("sendMail:", mailOptions, this.mailAuth);
      const info = await transporter.sendMail(mailOptions);
      const resp = {
        status: 1,
        message: "Email sent successfully.",
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
      };
      console.log("sendMail.response:", resp);
      return resp;
    } catch (e) {
      return { status: -1, message: "error sending email" };
    }
  };
}
export default Service;

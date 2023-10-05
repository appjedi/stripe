import MainDAO from "../dao/MainDAO";
import MyDAO from "../dao/MyDAO";
import Charge from "./stripe";
import nodeMailer from "nodemailer";
import { IMailAuth, ICart, IItem, IPurchase } from "../dao/Interfaces";
const GC_PRODUCTS = [
  { id: 1, name: "Patch", description: "Patch", price: 15 },
  { id: 2, name: "Gi with Patch", description: "Gi with Patch", price: 30 },
  { id: 3, name: "Promotion Fee", description: "Promotion Fee", price: 25 },
  { id: 4, name: "Donation", description: "Donation", price: 0 },
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
      //const myConn = this.getKeyValueLocal("MySQL_CONN", "");
      const myConn =
        '{"host":"appdojo.net","user":"appjedin_dba","database":"appjedin_wkk_prod","password":"$Data2022", "dialect":"mysql"}';
      console.log("myConn", myConn);
      this.dao = new MyDAO(JSON.parse(myConn + ""));
      let temp = this.getKeyValueLocal("MAIL_OPTIONS", "");
      //console.log("MAIL_OPTIONS:", temp);
      let obj = JSON.parse(temp + "");
      //console.log("MAIL_OPTIONS:", JSON.stringify(obj));
      this.mailAuth = <IMailAuth>obj;
      //console.log("mailAuth", this.mailAuth);
      //this.stripe = new Stripe();
    } catch (e) {
      console.log("Init error:", e);
    }
  };
  getProducts = async () => {
    return GC_PRODUCTS;
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
  getVideosFromMongo = async (id) => {
    try {
      const videos = await this.mainDAO.getVideos(id);
      return videos;
    } catch (e) {
      return { status: -1, message: "error" };
    }
  };
  saveVideo = async (data: Object) => {
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
  execute = async (query: string, values: Array<Object>) => {};

  getUsers = async (id) => {
    const users = await this.mainDAO.getUsers();
    //const suers = await this.dao.query("SELECT * FROM view_users");
    return users;
  };
  getStudents = async (id: number) => {
    try {
      const rows = await this.mainDAO.getStudents(id);
      const students = [];
      for (let row of rows) {
        students.push(row);
      }
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
  charge = async (email: string, fullName: string, amount: number) => {
    const item: IItem = {
      productId: 1,
      quantity: 1,
      price: amount,
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
  postAttendance = async (list) => {
    const msg = await this.mainDAO.postAttendance(list);
    return msg;
  };
  createStudent = async (student) => {
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

  sendMail = async (mailOptions) => {
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

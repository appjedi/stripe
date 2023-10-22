import mongoose from "mongoose";
import { ObjectId } from "mongodb"; // or ObjectID
import { Schema } from "mongoose";
import { model } from "mongoose";
import {
  IUser,
  IKeyValue,
  IPurchase,
  IDonation,
  ICart,
  IStudent,
  IVideo,
} from "./Interfaces";

class MainDAO {
  private url: string;
  private userDataSchema: Schema<IUser>;
  private UserData: mongoose.Model<IUser>;
  private donationSchema: Schema<IDonation>;
  private DonationData: mongoose.Model<IDonation>;
  private purchaseSchema: Schema<IPurchase>;
  private PurchaseData: mongoose.Model<IPurchase>;
  private keyValueSchema: Schema<IKeyValue>;
  private KeyValueData: mongoose.Model<IKeyValue>;
  private videoDataSchema: Schema<IVideo>;
  private VideoData: mongoose.Model<IVideo>;

  private studentDataSchema: Schema<IStudent>;
  private StudentData: mongoose.Model<IStudent>;
  constructor(url: string) {
    this.url = url; //this.getConnURL();
    this.init(this.url);
  }
  init = async (url: string) => {
    //console.log("MONGO URL", url);
    //console.log("MainDAO.init.process.env.MONGO_URL", process.env.MONGO_URL);
    const url2: string = process.env.MONGO_URL + "";
    this.url = url2;
    mongoose.connect(this.url);

    this.userDataSchema = new Schema<IUser>(
      {
        email: { type: String, required: true },
        password: String,
        lastName: String,
        firstName: String,
        status: Number,
        roleid: Number,
        donations: Array,
      },
      { collection: "users" }
    );
    this.UserData = mongoose.model("UserData", this.userDataSchema);

    this.donationSchema = new Schema(
      {
        id: String,
        userId: String,
        email: String,
        fullName: String,
        itemId: Number,
        amount: Number,
        status: Number,
        paid: String,
        posted: String,
      },
      { collection: "donations" }
    );
    this.DonationData = mongoose.model("DonationData", this.donationSchema);

    this.purchaseSchema = new Schema(
      {
        id: String,
        userId: String,
        email: String,
        fullName: String,
        items: Array,
        amount: Number,
        status: Number,
        paid: String,
        posted: String,
      },
      { collection: "purchases" }
    );
    this.PurchaseData = mongoose.model("PurchaseData", this.purchaseSchema);
    this.keyValueSchema = new Schema(
      {
        key: String,
        value: Object,
      },
      { collection: "key_values" }
    );
    this.KeyValueData = mongoose.model("KeyValueData", this.keyValueSchema);

    this.studentDataSchema = new Schema(
      {
        email: { type: String, required: true },
        name: String,
        id: Number,
        age: Number,
        attended: Number,
        parentGuardian: String,
        phoneNumber: String,
        startDate: String,
        status: Number,
        rank: Number,
        attendance: Array,
      },
      { collection: "students" }
    );

    this.StudentData = mongoose.model("StudentData", this.studentDataSchema);
  };
  addKeyValue = async (key: string, value: string) => {
    const rv = await this.KeyValueData.create({ key: key, value: value });
    return rv;
  };
  getKeyValue = async (key: string): Promise<String> => {
    try {
      const query = key === "all" ? {} : { key: key };
      //  console.log("getKeyValue:", key, query);
      const doc = await this.KeyValueData.find(query);
      //  console.log("DOC", doc);
      return doc[0].value;
    } catch (e) {
      console.log("getKeyValue.error", e);
      return "error";
    }
  };
  getKeyValues = async (): Promise<Array<IKeyValue>> => {
    try {
      const doc = await this.KeyValueData.find({});
      // console.log("DOC", doc);
      return doc;
    } catch (e) {
      console.log("getKeyValue.error", e);
      return [{ key: "ERR", value: "Error" }];
    }
  };
  getConnURL() {
    //console.log("getConnURL.process.env.MONGO_URL", process.env.MONGO_URL);
    return (
      process.env.MONGO_URL ||
      "mongodb+srv://appuser:AppData2022@cluster0.aga82.mongodb.net/FauziaA"
    );
    //return process.env.MONGO_URL || "mongodb://localhost:27017/FauziaA";
  }
  addPurchase = async (cart: ICart): Promise<Object> => {
    try {
      const user = await this.getUserByEmail(cart.email);
      console.log("addPurchase.user:", cart);
      const userId = 0; //(user ? user.userId : "");
      let amount: number = 0;
      for (let item of cart.cart) {
        //console.log("ADD ITEM:", item);
        amount += (item.price === 0 ? 1 : item.price) * item.quantity;
      }
      const id = new Date().getTime();
      const item = {
        id: id,
        userId: userId,
        email: cart.email,
        fullName: cart.fullName,
        items: cart.cart,
        amount: amount,
        status: 0,
        posted: new Date(),
        paid: null,
      };

      console.log("purchase:", item);
      const resp = await this.PurchaseData.create(item);
      console.log("purchase.RESP:", resp);
      //  const donations = await this.getDonations(cart.email);
      //await this.UserData.findOneAndUpdate({ email: cart.email }, { purchase: item });
      return { productId: id, amount: new Number(amount) };
    } catch (e) {
      console.log("addPurchase-Error:", e);
      return { staus: -1, productId: 0, amount: 0, message: "error" };
    }
    return 1;
  };
  updateFromStripe = async (id: number, status: number) => {
    const paid = new Date().getTime();
    //await this.DonationData.findOneAndUpdate({ id: id }, { status: status, paid: paid });
    await this.PurchaseData.findOneAndUpdate(
      { id: id },
      { status: status, paid: paid }
    );

    console.log("updateFromStripe.ID:", id);
    return "updated";
  };
  updateUser = async (
    userId,
    password1,
    password2,
    lastName,
    firstName,
    email,
    roleId,
    status
  ) => {
    try {
      if (password1 !== password2 || (password1 + "").length < 8) {
        return { status: -1, message: "passwords don't match or too short" };
      }
      const user = {
        email: email,
        password: password1,
        lastName: lastName,
        firstName: firstName,
        roleId: roleId,
        status: status,
      };
      const resp = await this.UserData.create(user);
      return user;
    } catch (e) {
      console.log(e);
      return { status: -1 };
    }
    return { status: -1 };
  };
  getDonations = async (email) => {
    const donations = await this.DonationData.find({ email: email });
    console.log("getDonations", donations);
    return donations;
  };
  addDonation = async (email, fullName, amount) => {
    try {
      // const user = await this.getUserByEmail(email);
      console.log("addDonation.user:", email, fullName);
      const userId = 1; //(user ? user.userId : "");

      const id = new Date().getTime();
      const donation = {
        id: id,
        userId: userId,
        email: email,
        fullName: fullName,
        amount: amount,
        status: 0,
        posted: new Date(),
        paid: null,
      };

      console.log("donation:", donation);
      // user.donations.push({ id: id, amount: amount, status: 0, paid: "" });
      const resp = await this.DonationData.create(donation);
      console.log("addDonation.RESP:", resp);
      const donations = await this.getDonations(email);
      // await this.UserData.findOneAndUpdate({ email: email }, { donations: donations });
      return id;
    } catch (e) {
      console.log(e);
      return -1;
    }
    return 1;
  };
  getUsers = async () => {
    const data = await this.UserData.find({});
    //const donations = data ? data.donations : [];
    const users: Array<Object> = [];
    for (let u of data) {
      console.log("U:", u);
      const user = {
        userId: u._id,
        username: u.email,
        lastName: u.lastName,
        firstName: u.firstName,
        email: u.email,
        password: "******",
        roleId: 1,
        status: 1,
        donations: u.donations,
      };
      users.push(user);
    }
    return users;
  };
  getUserById = async (id: string) => {
    const user = await this.UserData.findById(id);
    if (user) {
      return user;
    } else {
      null;
    }
  };
  getUserByEmail = async (email: string) => {
    const data = await this.UserData.find({ email: email });
    console.log("getUserByEmail", data);
    if (data && data.length > 0) {
      const u = data[0];
      return data[0].toObject();
    } else {
      const nm = email.split("@")[0];
      const user = {
        userId: "NF",
        username: email,
        lastName: nm,
        firstName: nm,
        email: email,
        password: "********",
        roleId: 0,
        status: 0,
        donations: [],
      };
      return user;
    }
  };
  getVideos = async (id: number) => { };
  // getStudents = async (id: number) => {};
  getStudents = async (id) => {
    const query = id === 0 ? {} : { _id: id };
    //console.log("getStudents v2:", query);
    const data = await this.StudentData.find(query);
    const students = [];
    for (let row of data) {
      students.push(row.toObject());
    }
    //const donations = data ? data.donations : [];
    return students;
  };
  createStudent = async (student: any) => {
    try {
      console.log("ManDAO.updateStudent pre:", student);
      const id = student.id;
      await this.StudentData.create(student);
      return { status: 1, message: "updateStudent done" };
    } catch (e) {
      console.log("ManDAO.updateStudent ex", e);
      return { status: -1, message: "createStudent failed" };
    }
  };
  postAttendance = async (list) => {
    try {
      for (let row of list) {
        console.log("ROW:", row);
        let s = await this.getStudents(row.id);
        if (s) {
          s = s[0];
          console.log("STUDENT:", s);
          const posted = new Date();
          const rec = {
            classDate: row.classDate,
            dojoId: row.dojoId,
            posted: posted,
          };
          if (!s["attendance"]) {
            console.log("NO ATTENDANCE");
            s["attendance"] = [];
          }
          //console.log("POSTING: ", s.attendance);
          const id = s["id"];
          s["attendance"].push(rec);
          console.log("POSTING: ", s["attendance"]);

          await this.StudentData.findOneAndUpdate(
            { id: id },
            { attendance: s["attendance"] }
          );
        }
      }
      const msg = list.length + " rows updated";
      return { status: 1, message: msg };
    } catch (e) {
      console.log("MainDAO.postAttendance ex", e);
      return { status: -1, message: "postAttendance error" };
    }
  };
  updateStudent = async (student: IStudent) => {
    try {
      const id = student.id;
      const data = {
        name: student.name,
        parentGuardian: student.parentGuardian,
        age: student.age,
        email: student.email,
        phoneNumber: student.phoneNumber,
        rank: student.rank,
        startDate: student.startDate,
        status: student.status,
      };
      console.log(id, "UPDATE STUDENT: ", data);
      await this.StudentData.findByIdAndUpdate(id, data);
      /*
       {
        startDate: student.startDate,
        status: student.status,
        age: student.age,
        phoneNumber: student.phoneNumber,
      }
      */
      return { status: 1, message: "updated" };
    } catch (e) {
      console.log(e);
      return { status: -1, message: "error updating student" };
    }
  };
  dbAuth = async (username: string, password: string): Promise<Object> => {
    const data = await this.UserData.find({ username: username });
    if (!data) {
      return { status: -1, message: "Not Found" };
    }
    if (data[0].password !== password) {
      return { status: -2, message: "Invalid password" };
    }
    console.log("dbAuth::", data[0]);

    const user = {
      id: 1,
      username: username,
      status: 1,
      message: "Authenticated",
      userId: data[0]._id,
    };
    console.log("returning user", user);
    return user;
  };
}
export default MainDAO;
// export {dbAuth, updateUser, getUsers,  addDonation, getUserByEmail, getDonations, updateFromStripe };ß

export interface IUser {
    email: { type: String, required: true },
    password: String;
    lastName: String;
    firstName: String;
    status: Number;
    roleid: Number;
    donations: Array<Object>;
}
export interface IKeyValue {
    key: String;
    value: String;
}
export interface IPurchase{
    id: String;
    userId: String;
    email: String;
    fullName: String;
    items: Array<Object>;
    amount: Number;
    status: Number;
    paid: String;
    posted: String;
}
export interface IDonation{
    id: String;
    userId: String;
    email: String;
    fullName: String;
    itemId: Number;
    amount: Number;
    status: Number;
    paid: String;
    posted: String;
}
export interface IMailAuth{
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
}
export interface IItem{
    productId: number;
    quantity: number;
    price: number;
}
export interface ICart{
    customerId: number;
    email: string;
    fullName: string;
    cart: Array<IItem>;
}
export interface IReceipt{
    productId: number;
    amount: Number;
}

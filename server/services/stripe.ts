//import { addDonation } from "../dao/dao1.mjs";
import Stripe from "stripe";
//import { StripeConfig } from 'stripe';
import MainDAO from "../dao/MainDAO.js";
/*
4242 4242 4242 4242
*/
//const stripe (process.env.STRIPE_PRIVATE_KEY);

class Charge {
  static charge = async (
    dao: MainDAO,
    id: number,
    amount: number,
    description: string
  ) => {
    try {
      console.log("CHARGE:", id, amount, description);
      //const dao = new MainDAO();
      const key = await dao.getKeyValue("PAYMENT_API_KEY");
      const reponseUrl = await dao.getKeyValue("PAYMENT_RESPONSE_URL");
      const stripe = new Stripe(key + "", {
        apiVersion: "2020-08-27",
      });

      console.log("DB.STRIPE_PRIVATE_KEY", key, "reponseUrl", reponseUrl);
      // const resp = await dao.addPurchase(cart);

      const test = [
        {
          price_data: {
            currency: "usd",
            product_data: { name: description },
            unit_amount: amount * 100,
          },
          quantity: 1,
        },
      ];

      const lineItems = [
        {
          price_data: {
            currency: "usd",
            product_data: { name: "purchase" },
            unit_amount: amount * 100,
          },
          quantity: 1,
        },
      ];
      const url = `${process.env.CLIENT_URL}/success/${id}/2023`;
      console.log("URL:", url);
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: lineItems,
        client_reference_id: id + "",
        success_url: `${reponseUrl}/success/${id}/2023`,
        cancel_url: `${reponseUrl}/cancel/${id}/2023`,
      });
      console.log("STRIPE SESSION", session, "URL:", session.url);
      return { status: 200, url: session.url };
    } catch (e) {
      console.log(e);
      return { status: -1, error: "Error" };
    }
  };
}
export default Charge;

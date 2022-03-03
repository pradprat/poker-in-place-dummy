const functions = require("firebase-functions");
const stripe = require("stripe");
import { configForHost } from './config';

async function getStripeClient(domain) {
  const stripeApiKey = await configForHost(domain, ["stripe", "api_key"]);
  console.log({ configForHost, domain, stripeApiKey });
  return stripe(stripeApiKey);
}

async function createCustomer(domain, name, email) {
  if (!email) throw new Error("Email missing");
  const stripeClient = await getStripeClient(domain);
  const customers = await stripeClient.customers.list({ limit: 1, email });

  let customer = customers.data[0];
  if (!customer) {
    customer = await stripeClient.customers.create({
      email,
    });
  }
  return customer;
}

module.exports = { createCustomer, getStripeClient };

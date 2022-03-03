const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { createCustomer, getStripeClient } = require("./stripe");
const logger = require("../utils/log").default;
const { loadConfig } = require('./config');
const db = admin.firestore();

let cachedProducts = {};
let cacheTime = 0;

const getUserDetails = async (uid) => {
  return db.collection("users").doc(uid).get();
};

const getCachedProducts = async (domain) => {
  const stripeClient = await getStripeClient(domain);
  if (!cachedProducts[domain] || cacheTime + 1000 * 60 * 20 < new Date().getTime()) {
    const products = await stripeClient.products.list();
    const prices = await stripeClient.prices.list();
    cachedProducts[domain] = products.data
      .filter((p) => p.metadata.active)
      .map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        subscriptionType: p.metadata.subscription_type,
        prices: prices.data
          .filter((price) => price.product === p.id)
          .map((price) => ({ id: price.id, price: price.unit_amount })),
      }));
    cacheTime = new Date().getTime();
  }
  return cachedProducts[domain];
};

/**
 * @swagger
 *
 * tags:
 *   name: Products
 *   description: Poker table management
 */

/**
 * @swagger
 *  components:
 *    schemas:
 *     Product:
 *       type: object
 *       properties:
 *          id:
 *            type: string
 *          name:
 *            type: string
 *          description:
 *            type: string
 *          subscriptionType:
 *            type: string
 *          prices:
 *            type: array
 *            items:
 *                type: object
 *                properties:
 *                  id:
 *                   type: string
 *                  price:
 *                    type: number
 */

/**
 * @swagger
 *
 * /products:
 *   post:
 *     tags: [Products]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: domain
 *         in: header
 *         required: true
 *         type: string
 *     responses:
 *         403:
 *           description: Not Authorized
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   error: 
 *                    type: string
 *         200:
 *           description: An array of products
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:  
 *                   products:
 *                     type: array
 *                     items: 
 *                         $ref: '#/components/schemas/Product'
 *                            
 */
async function products(request, response, { getTable }) {
  return response.json({
    products: await getCachedProducts(request.headers.domain),
  });
}

/**
 * @swagger
 *
 * /products/update:
 *   post:
 *     tags: [Products]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: origin
 *         in: header
 *         type: string
 *       - name: price
 *         in: query
 *         required: true
 *         type: string
 *       - name: email
 *         in: query
 *         required: true
 *         type: string
 *     responses:
 *         200:
 *           description: An object with product and paymentSessionId after updating the product
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:  
 *                   product:
 *                     type: string
 *                   paymentSessionId: 
 *                     type: string
 *                            
 */
async function updateProduct(request, response) {
  const { price, email } = request.query;
  const user = await getUserDetails(request.user.uid);
  const customer = await createCustomer(request.user.name, email || request.user.email);
  const userDetails = user.data() || {};
  const stripeClient = await getStripeClient(request.headers.domain);
  const config = await loadConfig();

  const rootUrl = (request.headers.origin || config.app.root_url).trimEnd('/');

  if (userDetails.subscription) {
    let subscription;
    try {
      subscription = await stripeClient.subscriptions.retrieve(
        userDetails.subscription
      );
    } catch (e) {
      await user.update({
        subscription: "",
        product: "",
      });
      return response.json({
        product: "",
      });
    }
    if (price) {
      const updatedSubscription = await stripeClient.subscriptions.update(
        userDetails.subscription,
        {
          cancel_at_period_end: false,
          proration_behavior: "create_prorations",
          items: [
            {
              id: subscription.items.data[0].id,
              price,
            },
          ],
        }
      );

      const products = await getCachedProducts(request.headers.domain);
      const product = products.find(
        (p) => p.id === updatedSubscription.plan.product
      );

      await user.update({
        product: updatedSubscription.plan.product,
        subscriptionType: product.subscriptionType,
      });

      return response.json({
        product: updatedSubscription.plan.product,
      });
    } else {
      try {
        await stripeClient.subscriptions.del(userDetails.subscription);
      } catch (e) {
        //
      }
      await user.update({
        subscription: "",
        subscriptionType: "",
        product: "",
      });
      return response.json({
        product: "",
      });
    }
  } else if (price) {
    const session = await stripeClient.checkout.sessions.create({
      mode: "subscription",
      customer: customer.id,
      payment_method_types: ["card"],
      line_items: [
        {
          price: price,
          quantity: 1,
        },
      ],
      success_url: `${rootUrl}/profile?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${rootUrl}/profile?cancel`,
    });

    return response.json({
      paymentSessionId: session.id,
    });
  } else {
    await user.update({
      subscriptionType: "",
      subscription: "",
      product: "",
    });

    return response.json({
      product: "",
    });
  }
}

/**
 * @swagger
 *
 * /products/confirm:
 *   post:
 *     tags: [Products]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: domain
 *         in: header
 *         required: true
 *         type: string
 *       - name: paymentSessionId
 *         in: query
 *         required: true
 *         type: string
 *       - name: email
 *         in: query
 *         required: true
 *         type: string
 *     responses:
 *         200:
 *           description: An object with product and paymentSessionId after after confirming for  the product
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:  
 *                   paymentSessionId: 
 *                     type: string
 *                            
 */
async function confirmProduct(request, response) {
  const { paymentSessionId, email } = request.query;
  const user = await getUserDetails(request.user.uid);
  const stripeClient = await getStripeClient(request.headers.domain);
  const customer = await createCustomer(request.user.name, email || request.user.email);

  try {
    const session = await stripeClient.checkout.sessions.retrieve(paymentSessionId);

    if (session && session.subscription) {
      const subscription = await stripeClient.subscriptions.retrieve(
        session.subscription
      );
      if (!subscription.canceled_at) {
        const products = await getCachedProducts(request.headers.domain);
        const product = products.find(
          (p) => p.id === subscription.plan.product
        );
        await user.update({
          customer: customer.id,
          subscription: session.subscription,
          subscriptionType: product.subscriptionType,
          product: subscription.plan.product,
        });
        return response.json({
          paymentSessionId: session.id,
        });
      }
    }
  } catch (e) {
    logger.exception(e);
  }
  return response.json({});
}

module.exports = { products, updateProduct, confirmProduct };

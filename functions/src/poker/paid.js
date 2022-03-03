const functions = require("firebase-functions");
const { getStripeClient } = require("./stripe");

/**
 * @swagger
 *
 * /paid:
 *   post:
 *     tags: [Tables]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: tableId
 *         in: query
 *         required: true
 *         type: string
 *       - name: paymentSessionId
 *         in: query
 *         required: true
 *         type: string
 *     responses:
 *         403:
 *           description: Something went wrong
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   error: 
 *                    type: string
 *         200:
 *           description: An object with boolean value to show if table is paid by user
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   paid: 
 *                    type: boolean
 */
async function paid(request, response, { getTable }) {
  const { tableId, paymentSessionId } = request.query;
  const tableDoc = await getTable(tableId, request.user.uid);
  if (!tableDoc) {
    return response.status(403).json({ error: "Unauthorized" });
  }

  const tableData = tableDoc.data();
  if (!tableData.players[request.user.uid]) {
    return response.status(403).json({ error: "Unauthorized" });
  }

  if (tableData.paymentId) {
    return response.json({
      paid: true,
    });
  }

  if (!tableData.paymentSessionId) {
    return response.json({
      paid: true,
    });
  }

  const stripeClient = await getStripeClient(request.headers.domain);
  const session = await stripeClient.checkout.sessions.retrieve(
    tableData.paymentSessionId
  );
  if (session && session.payment_intent) {
    tableDoc.update({ paymentId: session.payment_intent });

    return response.json({
      paid: true,
    });
  }

  return response.json({
    paid: false,
  });
}

async function generatePayment(request, response, { getTable }) {
  const { tableId, paymentSessionId } = request.query;
  const tableDoc = await getTable(tableId, request.user.uid);
  if (!tableDoc) {
    return response.status(403).json({ error: "Unauthorized" });
  }
  const tableData = tableDoc.data();

  const stripeClient = await getStripeClient(request.headers.domain);
  const session = await stripeClient.checkout.sessions.create({
    customer_email: request.user.email,
    payment_method_types: ["card"],
    line_items: [
      {
        name: "Poker501 Premium Game",
        description: `Usage charge for joining game`,
        images: [`${rootUrl}/logo-256.png`],
        amount: getModeCost(tableData.mode, tableData.payType) * 100, // pennies
        currency: "usd",
        quantity: 1,
      },
    ],
    success_url: `${rootUrl}/table/${tableDoc.id}?join&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${rootUrl}/?cancel`,
  });
}

module.exports = { paid, generatePayment };

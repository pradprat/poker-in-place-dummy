const functions = require("firebase-functions");

const { getStripeClient } = require('./stripe');
const { getModeCost, getMaximumDuration } = require("../engine/index");
const { loadConfig } = require('./config');

async function extendCreate(request, response, { db, getTable }) {
  const config = await loadConfig();
  const { tableId, mode } = request.query;
  const tableDoc = await getTable(tableId, request.user.uid);
  if (!tableDoc) {
    return response.status(404).send("Not found");
  }

  const rootUrl = (
    request.headers.origin || config.app.root_url
  ).trimEnd("/");

  const productTitle =
    rootUrl.indexOf("poker501.com") >= 0 ? "Poker501" : "Poker in Place";

  const tableData = tableDoc.data();
  const paymentType = tableData.paymentType;

  if (paymentType === "subscription") {
    // Allow for free extension
    // Ok so we have our payment. Time to extend the game
    const extensionInSeconds = getMaximumDuration(mode);
    const newEndTimestamp =
      Math.max(tableData.timestamp, new Date().getTime()) +
      extensionInSeconds * 1000;

    const extensionPaymentIds = tableData.extensionPaymentIds || [];

    tableDoc.update({
      stage: "active",
      timestamp: newEndTimestamp,
      extensionPaymentIds: [
        ...extensionPaymentIds,
        {
          paymentId: tableData.paymentId,
          timestamp: new Date().getTime(),
          uid: request.user.uid,
        },
      ],
    });
    return response.json({
      id: tableDoc.id,
    });
  }

  const stripeClient = await getStripeClient(request.headers.domain);
  const session = await stripeClient.checkout.sessions.create({
    customer_email: request.user.email,
    payment_method_types: ["card"],
    line_items: [
      {
        name: `${productTitle} Game Extension`,
        description: `Extending game for ${getMaximumDuration(mode) / 60
          } more minutes`,
        images: [`${rootUrl}/logo-256.png`],
        amount: getModeCost(mode) * 100, // pennies
        currency: "usd",
        quantity: 1,
      },
    ],
    success_url: `${rootUrl}/extend/${tableDoc.id}?action=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${rootUrl}/extend/${tableDoc.id}?action=cancel`,
  });
  const paymentSessionId = session.id;

  tableDoc.update({
    extensionPaymentSessionIds: [
      ...(tableData.extensionPaymentSessionIds || []),
      {
        paymentSessionId,
        mode,
        timestamp: new Date().getTime(),
        uid: request.user.uid,
      },
    ],
  });

  return response.json({
    id: tableDoc.id,
    paymentSessionId,
  });
}

async function extendConfirm(request, response, { getTable }) {
  const { tableId, paymentSessionId } = request.query;
  const tableDoc = await getTable(tableId, request.user.uid);
  if (!tableDoc) {
    return response.status(403).json({ error: "Unauthorized" });
  }

  const tableData = tableDoc.data();
  if (!tableData.players[request.user.uid]) {
    return response.status(403).json({ error: "Unauthorized" });
  }

  const extensionPaymentSessionIds = tableData.extensionPaymentSessionIds || [];
  const extensionPaymentIds = tableData.extensionPaymentIds || [];

  const existingSession = extensionPaymentSessionIds.find(
    (session) => session.paymentSessionId === paymentSessionId
  );
  if (!existingSession) {
    return response.status(400).json({ error: "Invalid Session" });
  }

  const stripeClient = await getStripeClient(request.headers.domain);
  const session = await stripeClient.checkout.sessions.retrieve(paymentSessionId);

  if (!session) {
    return response.status(400).json({ error: "Session Not Found" });
  }

  if (!session.payment_intent) {
    return response.status(400).json({ error: "Payment Not Found" });
  }
  const paymentExists = extensionPaymentIds.find(
    (payment) => payment.paymentId === session.payment_intent
  );

  if (paymentExists) {
    return response.status(400).json({ error: "Payment Already Applied" });
  }

  // Ok so we have our payment. Time to extend the game
  const extensionInSeconds = getMaximumDuration(existingSession.mode);
  const newEndTimestamp =
    Math.max(tableData.timestamp, new Date().getTime()) +
    extensionInSeconds * 1000;

  tableDoc.update({
    stage: "active",
    timestamp: newEndTimestamp,
    extensionPaymentIds: [
      ...extensionPaymentIds,
      {
        paymentId: session.payment_intent,
        timestamp: new Date().getTime(),
        uid: request.user.uid,
      },
    ],
  });

  return response.json({
    extended: false,
    timestamp: newEndTimestamp,
  });
}

module.exports = { extendCreate, extendConfirm };

const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");

const AccessToken = require("twilio").jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;
// require("dotenv").config();

const MAX_ALLOWED_SESSION_DURATION = 14400;
const app = express();
app.use(cors({ origin: true }));

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
app.post("/token", (request, response) => {
  const { identity, tableId } = request.query;
  const token = new AccessToken(
    "ACCOUNT_SID",
    "API_KEY_SID",
    "API_KEY_SECRET",
    {
      ttl: MAX_ALLOWED_SESSION_DURATION,
    }
  );
  token.identity = identity;
  const videoGrant = new VideoGrant({ room: tableId });
  token.addGrant(videoGrant);
  response.send(token.toJwt());
  console.log(`issued token for ${identity} in room ${tableId}`);
});

module.exports.router = functions.https.onRequest(app);

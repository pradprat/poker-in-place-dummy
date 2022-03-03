import * as admin from "firebase-admin";
// import * as functions from "firebase-functions";
import { setupLogger } from "./utils/log";
// import * as fs from "fs";

// try {
//   admin.initializeApp();
// } catch (e) {
//   console.error(e);
// }

if (admin.apps.length === 0) {
  admin.initializeApp();
}

// admin.remoteConfig().app.auth().
// admin.auth()..useEmulator("http://localhost:9099/");
// if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
//   // const creds = JSON.parse(
//   //   fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)
//   // );
//   console.log(
//     process.env.GOOGLE_APPLICATION_CREDENTIALS,
//     admin.credential.applicationDefault()
//   );
//   admin.initializeApp({ credential: admin.credential.applicationDefault() });
// }

setupLogger();

const poker = require("./poker");

exports.poker = poker.router;
exports.triggers = require("./triggers").router;
// Disable advancing timers
// exports.gameExpirationTimer = poker.gameExpirationTimer;
// exports.gameAdvancingTimer = poker.gameAdvancingTimer;
// exports.tournamentAdvancingTimer = poker.tournamentAdvancingTimer;

// if (functions.config().app.enable_pubsub) {
//   module.exports.gameAdvancingTimer = functions.pubsub
//     .schedule("every 1 minutes")
//     .onRun(poker.gameAdvancingTimer);

//   module.exports.tournamentAdvancingTimer = functions.pubsub
//     .schedule("every 1 minutes")
//     .onRun(poker.tournamentAdvancingTimer);

//   module.exports.gameExpirationTimer = functions.pubsub
//     .schedule("every 20 minutes")
//     .onRun(poker.gameExpirationTimer);
// }

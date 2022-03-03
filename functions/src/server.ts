import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { setupLogger } from "./utils/log";
import { cache } from "./poker/utils";
// import { launchWatchers } from "./poker";
import swaggerUi from "swagger-ui-express";

const http = require("http");
const https = require("https");
const fs = require("fs");
const swaggerJsdoc = require("swagger-jsdoc");

console.log("Loading...");

const options = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Poker in Place Service API",
      version: "1.0.0",
    },
  },
  apis: ["**/api/*.*s", "**/tournaments/**/*.*s", "**/poker/*.*s"],
};

const swaggerSpecification = swaggerJsdoc(options);

if (admin.apps.length === 0) {
  admin.initializeApp();
}

setupLogger();

const poker = require("./poker");
poker.app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecification));

// Turn on the cache
cache.enable();

const tls = process.env.HTTPS_CERT_FULLCHAIN
  ? {
      cert: fs.readFileSync(process.env.HTTPS_CERT_FULLCHAIN),
      key: fs.readFileSync(process.env.HTTPS_CERT_PRIVKEY),
    }
  : {};

const apiHostName = process.env.API_HOST_NAME;

https.createServer(tls, poker.app).listen(443, "0.0.0.0", () => {
  if (!!functions.config().app.enable_timers) {
    console.log(`enable_timers enabled. Launching timers`);
    const runAdvances = async () => {
      console.log(`run timers enabled. running timers`);
      await Promise.all([
        poker.gameAdvancingTimer(apiHostName),
        poker.tournamentAdvancingTimer(apiHostName),
      ]);
      console.log(`run timers done`);
      setTimeout(runAdvances, 5 * 1000);
    };
    setTimeout(runAdvances, 3 * 1000);
    setInterval(() => poker.gameExpirationTimer(apiHostName), 60 * 1000 * 5);
    setInterval(() => poker.tournamentFinalizeTimer(apiHostName), 30 * 1000);
  }
});
http.createServer(poker.app).listen(80, "0.0.0.0", () => {
  console.log("connected");
});

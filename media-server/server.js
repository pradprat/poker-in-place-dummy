#!/usr/bin/env node

process.title = "mediasoup-demo-server";
process.env.DEBUG = process.env.DEBUG || "*INFO* *WARN* *ERROR*";

const config = require("./config");

/* eslint-disable no-console */
console.log("process.env.DEBUG:", process.env.DEBUG);
console.log("config.js:\n%s", JSON.stringify(config, null, "  "));
/* eslint-enable no-console */

const fs = require("fs");
const https = require("https");
const url = require("url");
const protoo = require("protoo-server");
const mediasoup = require("mediasoup");
const express = require("express");
const bodyParser = require("body-parser");
const { AwaitQueue } = require("awaitqueue");
const Logger = require("./lib/Logger");
const Room = require("./lib/Room");
const interactiveServer = require("./lib/interactiveServer");
const interactiveClient = require("./lib/interactiveClient");
const swaggerJsdoc = require("swagger-jsdoc");
import swaggerUi from "swagger-ui-express";

const options = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Poker in Place Service Media server API",
      version: "1.0.0",
    },
  },
  apis: ["**/server.js"],
};

const swaggerSpecification = swaggerJsdoc(options);


const logger = new Logger();

// Async queue to manage rooms.
// @type {AwaitQueue}
const queue = new AwaitQueue();

// Map of Room instances indexed by roomId.
// @type {Map<Number, Room>}
const rooms = new Map();

// HTTPS server.
// @type {https.Server}
let httpsServer;

// Express application.
// @type {Function}
let expressApp;

// Protoo WebSocket server.
// @type {protoo.WebSocketServer}
let protooWebSocketServer;

// mediasoup Workers.
// @type {Array<mediasoup.Worker>}
const mediasoupWorkers = [];

// Index of next mediasoup Worker to use.
// @type {Number}
let nextMediasoupWorkerIdx = 0;

run();

async function run() {
  // Open the interactive server.
  await interactiveServer();

  // Open the interactive client.
  if (process.env.INTERACTIVE === "true" || process.env.INTERACTIVE === "1")
    await interactiveClient();

  // Run a mediasoup Worker.
  await runMediasoupWorkers();

  // Create Express app.
  await createExpressApp();

  // Run HTTPS server.
  await runHttpsServer();

  // Run a protoo WebSocketServer.
  await runProtooWebSocketServer();

  // Log rooms status every X seconds.
  setInterval(() => {
    for (const room of rooms.values()) {
      room.logStatus();
    }
  }, 120000);
}

async function spawnWorker() {
  const worker = await mediasoup.createWorker({
    logLevel: config.mediasoup.workerSettings.logLevel,
    logTags: config.mediasoup.workerSettings.logTags,
    rtcMinPort: Number(config.mediasoup.workerSettings.rtcMinPort),
    rtcMaxPort: Number(config.mediasoup.workerSettings.rtcMaxPort),
  });

  worker.startTime = new Date().getTime();

  worker.on("died", () => {
    logger.error(
      "mediasoup Worker died, exiting  in 2 seconds... [pid:%d]",
      worker.pid
    );

    spawnWorker();
  });

  mediasoupWorkers.push(worker);
  return worker;
}

/**
 * Launch as many mediasoup Workers as given in the configuration file.
 */
async function runMediasoupWorkers() {
  const { numWorkers } = config.mediasoup;

  logger.info("running %d mediasoup Workers...", numWorkers);

  for (let i = 0; i < numWorkers; ++i) {
    const worker = await spawnWorker();
  }

  // Log worker resource usage every X seconds.
  setInterval(async () => {
    try {
      for (let i = 0; i < mediasoupWorkers.length; ++i) {
        const usage = await mediasoupWorkers[i].getResourceUsage();

        logger.info(
          "mediasoup Worker resource usage [pid:%d]: %o",
          worker.pid,
          usage
        );
      }
    } catch (e) {
      logger.error(e);
    }
  }, 30 * 1000);
}

/**
 * Create an Express based API server to manage Broadcaster requests.
 */
async function createExpressApp() {
  logger.info("creating Express app...");

  expressApp = express();

  expressApp.use(bodyParser.json());
  expressApp.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecification));

  /**
   * API GET resource that returns the mediasoup Router RTP capabilities of
   * the room.
   * @swagger
   *   /health:
   *     get:
   *       tags: [Healths]
   *       produces:
   *         - application/json
   *       responses:
   *         200:
   *           description:   An object for health of each worker of api
   *           content:
   *             application/json:
   *               schema:
   *                 type: object
   *                 properties:
   *                   error:
   *                     type: string
   *                   data:
   *                     type: object
   *                     properties:
   *                        version:
   *                          type: string
   *                        workers:
   *                         type: array
   *                         items:
   *                           type: object
   *                           properties:
   *                             startTime:
   *                               type: string
   *                             usage:
   *                               type: object
   */
  expressApp.get("/health", async (req, res) => {
    try {
      const data = {
        workers: [],
        version: '2020-09-24',
      };
      for (let i = 0; i < mediasoupWorkers.length; ++i) {
        const worker = mediasoupWorkers[i];
        const usage = await worker.getResourceUsage();
        data.workers[i] = {
          startTime: worker.startTime,
          usage,
        };
      }

      res.status(200).json(data);
    } catch (e) {
      res.status(200).json({ error: e.toString() });
    }
  });

  /**
   * For every API request, verify that the roomId in the path matches and
   * existing room.
   */
  expressApp.param("roomId", (req, res, next, roomId) => {
    // The room must exist for all API requests.
    if (!rooms.has(roomId)) {
      const error = new Error(`room with id "${roomId}" not found`);

      error.status = 404;
      throw error;
    }

    req.room = rooms.get(roomId);

    next();
  });

  /**
   * @swagger
   *
   * tags:
   *   name: Healths
   *   description: Media server health api
   */

  /**
   * @swagger
   *
   * tags:
   *   name: Rooms
   *   description: Media server room api
   */

  /**
   * API GET resource that returns the mediasoup Router RTP capabilities of
   * the room.
   * @swagger
   *   /rooms/{roomId}:
   *     get:
   *       tags: [Healths]
   *       produces:
   *         - application/json
   *       parameters:
   *         - name: roomId
   *         in: path
   *         required: true
   *         type: string
   *       responses:
   *         200:
   *           description: An object showing health of api
   *           content:
   *             application/json:
   *               schema:
   *                 type: object
   *                 properties:
   *                   error:
   *                     type: string
   *                   data:
   *                     type: object
   *       responses:
   *         200:
   *           description: Mediasoup Router RTP capabilities of the room.
   *           content:
   *             application/json:
   *               schema:
   *                 type: object
   *                 properties:
   *                   error:
   *                     type: string
   *                   data:
   *                     type: object
   */
  expressApp.get("/rooms/:roomId", (req, res) => {
    const data = req.room.getRouterRtpCapabilities();

    res.status(200).json(data);
  });

  /**
   * POST API to create a Broadcaster.
   * @swagger
   *   /rooms/{roomId}/broadcasters:
   *     post:
   *       tags: [Rooms]
   *       produces:
   *         - application/json
   *       parameters:
   *         - name: roomId
   *         in: path
   *         required: true
   *         type: string
   *       responses:
   *         200:
   *           description: A Broadcaster
   *           content:
   *             application/json:
   *               schema:
   *                 type: object
   *                 properties:
   *                   error:
   *                     type: string
   *                   data:
   *                     type: object
   */
  expressApp.post("/rooms/:roomId/broadcasters", async (req, res, next) => {
    const { id, displayName, device, rtpCapabilities } = req.body;

    try {
      const data = await req.room.createBroadcaster({
        id,
        displayName,
        device,
        rtpCapabilities,
      });

      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  });

  /**
   * DELETE API to delete a Broadcaster.
   * @swagger
   *   /rooms/{roomId}/broadcasters/{broadcasterId}:
   *     delete:
   *       tags: [Rooms]
   *       produces:
   *         - application/json
   *       parameters:
   *         - name: roomId
   *         in: path
   *         required: true
   *         type: string
   *         - name: broadcasterId
   *         in: path
   *         required: true
   *         type: string
   *       responses:
   *         200:
   *           description: An object with message of successful deletion
   *           content:
   *             application/json:
   *               schema:
   *                 type: object
   *                 properties:
   *                   error:
   *                     type: string
   */
  expressApp.delete(
    "/rooms/:roomId/broadcasters/:broadcasterId",
    (req, res) => {
      const { broadcasterId } = req.params;

      req.room.deleteBroadcaster({ broadcasterId });

      res.status(200).send("broadcaster deleted");
    }
  );

  /**
   * POST API to create a mediasoup Transport associated to a Broadcaster.
   * It can be a PlainTransport or a WebRtcTransport depending on the
   * type parameters in the body. There are also additional parameters for
   * PlainTransport.
   * @swagger
   *   /rooms/{roomId}/broadcasters/{broadcasterId}/transports:
   *     post:
   *       tags: [Rooms]
   *       produces:
   *         - application/json
   *       parameters:
   *         - name: roomId
   *         in: path
   *         required: true
   *         type: string
   *         - name: type
   *         in: body
   *         required: true
   *         type: string
   *         - name: rtcpMux
   *         in: body
   *         required: true
   *         type: string
   *         - name: comedia
   *         in: body
   *         required: true
   *         type: string
   *         - name: broadcasterId
   *         in: path
   *         required: true
   *         type: string
   *       responses:
   *         200:
   *           description: Mediasoup Transport associated to a Broadcaster
   *           content:
   *             application/json:
   *               schema:
   *                 type: object
   *                 properties:
   *                   error:
   *                     type: string
   *                   data:
   *                     type: object
   */
  expressApp.post(
    "/rooms/:roomId/broadcasters/:broadcasterId/transports",
    async (req, res, next) => {
      const { broadcasterId } = req.params;
      const { type, rtcpMux, comedia } = req.body;

      try {
        const data = await req.room.createBroadcasterTransport({
          broadcasterId,
          type,
          rtcpMux,
          comedia,
        });

        res.status(200).json(data);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * POST API to connect a Transport belonging to a Broadcaster. Not needed
   * for PlainTransport if it was created with comedia option set to true.
   * @swagger
   *   /rooms/{roomId}/broadcasters/{broadcasterId}/transports/{transportId}/connect:
   *     post:
   *       tags: [Rooms]
   *       produces:
   *         - application/json
   *       parameters:
   *         - name: dtlsParameters
   *         in: body
   *         required: true
   *         type: string
   *         - name: transportId
   *         in: path
   *         required: true
   *         type: string
   *         - name: broadcasterId
   *         in: path
   *         required: true
   *         type: string
   *       responses:
   *         200:
   *           description: Transport belonging to a Broadcaster
   *           content:
   *             application/json:
   *               schema:
   *                 type: object
   *                 properties:
   *                   error:
   *                     type: string
   *                   data:
   *                     type: object
   */
  expressApp.post(
    "/rooms/:roomId/broadcasters/:broadcasterId/transports/:transportId/connect",
    async (req, res, next) => {
      const { broadcasterId, transportId } = req.params;
      const { dtlsParameters } = req.body;

      try {
        const data = await req.room.connectBroadcasterTransport({
          broadcasterId,
          transportId,
          dtlsParameters,
        });

        res.status(200).json(data);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * POST API to create a mediasoup Producer associated to a Broadcaster.
   * The exact Transport in which the Producer must be created is signaled in
   * the URL path. Body parameters include kind and rtpParameters of the
   * Producer.
   * @swagger
   *   "/rooms/{roomId}/broadcasters/{broadcasterId}/transports/{transportId}/producers:
   *     post:
   *       tags: [Rooms]
   *       produces:
   *         - application/json
   *       parameters:
   *         - name: rtpParameters
   *         in: body
   *         required: true
   *         type: string
   *         - name: kind
   *         in: body
   *         required: true
   *         type: string
   *         - name: transportId
   *         in: path
   *         required: true
   *         type: string
   *         - name: broadcasterId
   *         in: path
   *         required: true
   *         type: string
   *       responses:
   *         200:
   *           description: Mediasoup Producer associated to a Broadcaster
   *           content:
   *             application/json:
   *               schema:
   *                 type: object
   *                 properties:
   *                   error:
   *                     type: string
   *                   data:
   *                     type: object
   */
  expressApp.post(
    "/rooms/:roomId/broadcasters/:broadcasterId/transports/:transportId/producers",
    async (req, res, next) => {
      const { broadcasterId, transportId } = req.params;
      const { kind, rtpParameters } = req.body;

      try {
        const data = await req.room.createBroadcasterProducer({
          broadcasterId,
          transportId,
          kind,
          rtpParameters,
        });

        res.status(200).json(data);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * POST API to create a mediasoup Consumer associated to a Broadcaster.
   * The exact Transport in which the Consumer must be created is signaled in
   * the URL path. Query parameters must include the desired producerId to
   * consume.
   * @swagger
   *   "/rooms/{roomId}/broadcasters/{broadcasterId}/transports/{transportId}/consume:
   *     post:
   *       tags: [Rooms]
   *       produces:
   *         - application/json
   *       parameters:
   *         - name: producerId
   *         in: query
   *         required: true
   *         type: string
   *         - name: kind
   *         in: body
   *         required: true
   *         type: string
   *         - name: transportId
   *         in: path
   *         required: true
   *         type: string
   *         - name: broadcasterId
   *         in: path
   *         required: true
   *         type: string
   *       responses:
   *         200:
   *           description: Mediasoup Consumer associated to a Broadcaster
   *           content:
   *             application/json:
   *               schema:
   *                 type: object
   *                 properties:
   *                   error:
   *                     type: string
   *                   data:
   *                     type: object
   */
  expressApp.post(
    "/rooms/:roomId/broadcasters/:broadcasterId/transports/:transportId/consume",
    async (req, res, next) => {
      const { broadcasterId, transportId } = req.params;
      const { producerId } = req.query;

      try {
        const data = await req.room.createBroadcasterConsumer({
          broadcasterId,
          transportId,
          producerId,
        });

        res.status(200).json(data);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Error handler.
   */
  expressApp.use((error, req, res, next) => {
    if (error) {
      logger.warn("Express app %s", String(error));

      error.status = error.status || (error.name === "TypeError" ? 400 : 500);

      res.statusMessage = error.message;
      res.status(error.status).send(String(error));
    } else {
      next();
    }
  });
}

/**
 * Create a Node.js HTTPS server. It listens in the IP and port given in the
 * configuration file and reuses the Express application as request listener.
 */
async function runHttpsServer() {
  logger.info("running an HTTPS server...");

  // HTTPS server for the protoo WebSocket server.
  const tls = {
    cert: fs.readFileSync(config.https.tls.cert),
    key: fs.readFileSync(config.https.tls.key),
  };

  httpsServer = https.createServer(tls, expressApp);

  await new Promise((resolve) => {
    console.log("\n\n media  port and ip", config.https.listenPort, config.https.listenIp)
    httpsServer.listen(
      Number(config.https.listenPort),
      config.https.listenIp,
      resolve
    );
  });
}

/**
 * Create a protoo WebSocketServer to allow WebSocket connections from browsers.
 */
async function runProtooWebSocketServer() {
  logger.info("running protoo WebSocketServer...");

  // Create the protoo WebSocket server.
  protooWebSocketServer = new protoo.WebSocketServer(httpsServer, {
    maxReceivedFrameSize: 960000, // 960 KBytes.
    maxReceivedMessageSize: 960000,
    fragmentOutgoingMessages: true,
    fragmentationThreshold: 960000,
  });

  // Handle connections from clients.
  protooWebSocketServer.on("connectionrequest", (info, accept, reject) => {
    // The client indicates the roomId and peerId in the URL query.
    const u = url.parse(info.request.url, true);
    const roomId = u.query["roomId"];
    const peerId = u.query["peerId"];

    if (!roomId || !peerId) {
      reject(400, "Connection request without roomId and/or peerId");

      return;
    }

    logger.info(
      "protoo connection request [roomId:%s, peerId:%s, address:%s, origin:%s]",
      roomId,
      peerId,
      info.socket.remoteAddress,
      info.origin
    );

    // Serialize this code into the queue to avoid that two peers connecting at
    // the same time with the same roomId create two separate rooms with same
    // roomId.
    queue
      .push(async () => {
        const room = await getOrCreateRoom({ roomId });

        // Accept the protoo WebSocket connection.
        const protooWebSocketTransport = accept();

        room.handleProtooConnection({ peerId, protooWebSocketTransport });
      })
      .catch((error) => {
        logger.error("room creation or room joining failed:%o", error);

        reject(error);
      });
  });
}

/**
 * Get next mediasoup Worker.
 */
function getMediasoupWorker() {
  const worker = mediasoupWorkers[nextMediasoupWorkerIdx];

  if (++nextMediasoupWorkerIdx === mediasoupWorkers.length)
    nextMediasoupWorkerIdx = 0;

  return worker;
}

/**
 * Get a Room instance (or create one if it does not exist).
 */
async function getOrCreateRoom({ roomId }) {
  let room = rooms.get(roomId);

  // If the Room does not exist create a new one.
  if (!room) {
    logger.info("creating a new Room [roomId:%s]", roomId);

    const mediasoupWorker = getMediasoupWorker();

    room = await Room.create({ mediasoupWorker, roomId });

    rooms.set(roomId, room);
    room.on("close", () => rooms.delete(roomId));
  }

  return room;
}
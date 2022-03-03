import express from "express";
import {
  GetTableFunction,
  AuthenticatedRequest,
  typedDb,
  IServerGame,
} from "./lib";
import { isPlayerTabled, getModeVideoEnabled } from "../engine/index";
import { GameStage, IJwtUser, PlayerRole } from "../engine/types";
import { FirebaseTypedDoc } from "./utils";
import { loadConfig } from "./config";

const twilio = require("twilio");
const AccessToken = twilio.jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;

const MAX_ALLOWED_SESSION_DURATION = 14400;

const logger = require("../utils/log").default;

export async function enableVideo(
  tableDoc: FirebaseTypedDoc<IServerGame>,
  user?: IJwtUser
) {
  const tableData = tableDoc.data();
  const config = await loadConfig();

  const mediaSoupHostNames = (config.app.mediasoup_hostnames || "").split(",");

  let mediasoupHost;
  const isAlreadyJoined =
    !user ||
    isPlayerTabled(tableData, tableData.players[user.uid]) ||
    (tableData.players[user.uid] &&
      (tableData.players[user.uid].role === PlayerRole.Observer ||
        tableData.players[user.uid].role === PlayerRole.Featured));

  if (!isAlreadyJoined && tableData.organizerId !== user?.uid) {
    throw new Error("Unauthorized");
  }

  if (!getModeVideoEnabled(tableData.mode)) {
    if (tableData.stage === GameStage.Initialized) {
      await tableDoc.update({
        timestamp: new Date().getTime(),
        stage: GameStage.Waiting,
      });
    }
    return { toJwt: (): string => null };
  } else {
    if (tableData.stage === GameStage.Initialized) {
      // TODO - add logic to determine which media server to use
      const activeMediaTables = await typedDb
        .collection<IServerGame>("tables")
        .where("hostedMedia", "==", "mediasoup")
        .where("stage", "in", ["active", "paused", "waiting"])
        .select("mediasoupHost")
        .get();

      const index = Math.floor(Math.random() * mediaSoupHostNames.length);
      mediasoupHost = mediaSoupHostNames[index];

      for (const doc of activeMediaTables.docs) {
        console.log(doc.data());
      }

      await tableDoc.update({
        timestamp: new Date().getTime(),
        stage: GameStage.Waiting,
        mediasoupHost,
      });
    }
  }

  const useMediaSoup = tableData.hostedMedia === "mediasoup";

  // OK we're good to go
  let room;

  if (!room && !useMediaSoup && tableData.stage === "waiting") {
    // Something wrong happened
    throw new Error("Room does not exist, but has been created before");
  }

  if (!room) {
    if (tableData.stage == "initialized") {
      await tableDoc.update({
        timestamp: new Date().getTime(),
        stage: GameStage.Waiting,
      });
    }
  }

  if (!user) {
    return null;
  }

  const accessToken = new AccessToken(
    "ACCOUNT_SID",
    "API_KEY_SID",
    "API_KEY_SECRET",
    {
      ttl: MAX_ALLOWED_SESSION_DURATION,
    }
  );
  accessToken.identity = JSON.stringify(
    tableData.hostedMedia === "mediasoup"
      ? {
          id: user.uid,
          name: user.name || user.uid,
          hostedMedia: tableData.hostedMedia,
          mediaServerRoot: tableData.mediasoupHost || mediasoupHost,
        }
      : {
          id: user.uid,
          name: user.name || user.uid,
          hostedMedia: tableData.hostedMedia,
        }
  );
  const videoGrant = new VideoGrant({ room: tableDoc.id });
  accessToken.addGrant(videoGrant);
  return accessToken;
}

/**
 * @swagger
 *
 * /token:
 *   post:
 *     tags: [Tables]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: tableId
 *         in: body
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
 *         500:
 *           description: Internal Server Error
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   error: 
 *                    type: string
 *         200:
 *           description: An object with token for joining the table
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   token: 
 *                    type: string
 */
export async function token(
  request: AuthenticatedRequest,
  response: express.Response,
  { getTable }: { getTable: GetTableFunction }
) {
  const { tableId } = JSON.parse(request.body);

  const tableDoc = await getTable(tableId, request.user.uid);

  if (!tableDoc) {
    return response.status(403).json({ error: "Unauthorized" });
  }

  // Deal with payment through stripe links
  // if (!isPaid(tableData, request.user.uid)) {
  //   return response.status(403).json({ error: "Payment not received" });
  // }

  try {
    const accessToken = await enableVideo(tableDoc, request.user);

    return response.json({
      token: accessToken.toJwt(),
    });
  } catch (e) {
    logger.exception(e);
    return response.status(500).json({ error: (e as any).message });
  }
}

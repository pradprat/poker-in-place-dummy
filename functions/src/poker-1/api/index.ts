import express from "express";
import {
  ITournamentDetails,
  IGame,
  IGameFeatures,
  GameMode,
  GameType,
  PayType,
  GameStage,
} from "../../engine/types";
import { typedDb } from "../utils";
import { createGame } from "../create";
import { loadConfig } from "../config";
interface AuthenticatedRequest extends express.Request {
  user: { uid: string; name: string; email: string; picture: string };
  service?: { username: string };
}
/**
 * @swagger
 *
 * tags:
 *   name: Tables
 *   description: Poker table management
 */
/**
 * @swagger
 *
 * tags:
 *   name: Tournaments
 *   description: Poker tournament management
 */

/**
 * @swagger
 *  components:
 *    schemas:
 *     Table:
 *       type: object
 *       properties:
 *          id:
 *            type: string
 *          tournamentId:
 *            type: string
 *          activeHandId:
 *            type: string
 *          buyIn:
 *            type: number
 *          startingBigBlind:
 *            type: number
 *          currentBigBlind:
 *            type: number
 *          increment:
 *            type: number
 *          blindDoublingInterval:
 *            type: number
 *          players:
 *            type: object
 *          stage:
 *            type: string
 *          name:
 *            type: string
 *          mode:
 *            type: string
 *          paymentId:
 *            type: string
 *          paymentSessionId:
 *            type: string
 *          timestamp:
 *            type: number
 *          organizerId:
 *            type: string
 *          tournamentDetails:
 *            type: object
 *          branding:
 *            type: object
 *            properties:
 *              tableImageUrl:
 *                type: string
 *              registrationImageUrl:
 *                type: string
 *          features:
 *            type: object
 *            properties:
 *              autoFlipEnabled:
 *                type: boolean
 *              removeOnLeave:
 *                type: boolean
 *              allowNonOrganizerStart:
 *                type: boolean
 *              startWithVideoEnabled:
 *                type: boolean
 *              hideCopyLink:
 *                type: boolean
 *          apiServerHost:
 *            type: string
 */

/**
 * @swagger
 *
 * /api/table:
 *   post:
 *     tags: [Tables]
 *     produces:
 *       - application/json
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Table'
 *     responses:
 *         200:
 *           description: An array of strings which are the table IDs
 *           schema:
 *            type: array
 *            items:
 *              type: string
 */
async function createTable(
  request: AuthenticatedRequest,
  response: express.Response,
  { db }: { db: FirebaseFirestore.Firestore }
) {
  const config = await loadConfig();
  const requestBody = JSON.parse(request.body);
  const rootUrl = (request.headers.origin || config.app.root_url).trimEnd("/");
  const domain = request.headers.domain as string;
  const productTitle =
    domain.indexOf("poker501.com") >= 0 ? "Poker501" : "Poker in Place";

  const {
    title = `${productTitle} Cash Game`,
    buyInAmount = 20,
    bigBlindAmount = 0.5,
    blindIncreaseDuration = 0,
    // increment = 0.25,
    emails = "",
    mode = GameMode.Premium_8_1440,
    type = GameType.Cash,
    payType = PayType.UpFront,
    code,
    startDate = new Date().toISOString(),
    timeZone = "America/Los_Angeles",
    features = {
      allowNonOrganizerStart: true,
      removeOnLeave: true,
      // startWithVideoEnabled: true,
    },
    hostedMedia,
    branding = {},
    count = 1,
  }: {
    title: string;
    buyInAmount: number;
    bigBlindAmount: number;
    blindIncreaseDuration: number;
    increment: number;
    emails: string;
    mode: GameMode;
    type: GameType;
    payType: PayType;
    code: string;
    startDate: string;
    timeZone: string;
    hostedMedia: string;
    features: IGameFeatures;
    count?: number;
    branding?: {
      tableImageUrl?: string;
      primaryColor?: string;
      secondaryColor?: string;
      customCss?: string;
    };
  } = requestBody;

  try {
    const tableIds = [];
    for (let i = 0; i < count; ++i) {
      const { tableDoc } = await createGame(
        {
          title,
          buyInAmount,
          bigBlindAmount,
          blindIncreaseDuration,
          emails,
          mode,
          type,
          payType,
          code,
          startDate,
          timeZone,
          hostedMedia,
          features,
          branding,
          paymentId: request.service?.username,
          // Optional
        },
        rootUrl,
        domain
      );
      tableIds.push(tableDoc.id);
    }
    return response.json(tableIds);
  } catch (e) {
    return response.json({ error: e.message });
  }
}

/**
 * @swagger
 *
 * /api/table:
 *   get:
 *     tags: [Tables]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id
 *         in: query
 *         required: true
 *         type: string
 *     responses:
 *         200:
 *           description: A table object
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Table'
 */
async function getTable(
  request: AuthenticatedRequest,
  response: express.Response,
  { db }: { db: FirebaseFirestore.Firestore }
) {
  const id = request.query.id as string;

  const table = await typedDb.collection<IGame>("tables").doc(id).get();
  if (!table.exists) {
    return response.status(404).json({});
  }
  return response.json(table.data());
}

async function resetTable(
  request: AuthenticatedRequest,
  response: express.Response,
  { db }: { db: FirebaseFirestore.Firestore }
) {
  const id = request.query.id as string;

  const table = await typedDb.collection<IGame>("tables").doc(id).get();
  if (!table.exists) {
    return response.status(404).json({});
  }
  await table.update({
    players: {},
    stage: GameStage.Waiting,
    timestamp: new Date().getTime(),
    activeHandId: null,
  });
  return response.json(table.data());
}

/**
 * @swagger
 *
 * /api/tournament:
 *   get:
 *     tags: [Tournaments]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id
 *         in: query
 *         required: true
 *         type: string
 */
async function getTournament(
  request: AuthenticatedRequest,
  response: express.Response,
  { db }: { db: FirebaseFirestore.Firestore }
) {
  const id = request.query.id as string;

  const tournament = await typedDb
    .collection<ITournamentDetails>("tournaments")
    .doc(id)
    .get(true);
  if (!tournament.exists) {
    return response.status(404).json({});
  }
  return response.json(tournament.data());
}

module.exports = {
  getTournament,
  getTable,
  resetTable,
  createTable,
};

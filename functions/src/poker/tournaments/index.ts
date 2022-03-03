import { groupBy } from "ramda";
import twilio from "twilio";
import express from "express";
import CSVParse from "csv-parse";
import stripBom from "strip-bom";

import fetch from "node-fetch";
import {
  cache,
  FirebaseTypedWriteBatch,
  acquireLockAndExecute,
  typedDb,
} from "../utils";
import {
  IPlayer,
  ITournamentDetails,
  GameMode,
  PayType,
  GameType,
  TournamentStatus,
  GameStage,
  IHand,
  IPlayerState,
  PlayerRole,
  TournamentRegistrationMode,
  ITournamentRegistration,
  ITournamentPlayer,
  IRebuy,
  IGame,
  ICode,
  IUserDetails,
  IRebuyOptions,
  BrandingType,
  ActionDirective,
} from "../../engine/types";
import tinyUid from "../../utils/tiny-uid";
import { loadConfig } from "../config";

const { hashCode } = require("../../engine/utils");
const { getStripeClient } = require("../stripe");
const { shuffle } = require("../../utils/deck");
const logger = require("../../utils/log").default;
const admin = require("firebase-admin");

const AccessToken = twilio.jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;

const MAX_ALLOWED_SESSION_DURATION = 14400;

const { sendInvite } = require("../invite");
const { createCustomer } = require("../stripe");
import {
  respondAndAdvanceTournamentHand,
  GetTournamentFunction,
  pauseOrResumeTournament,
  lockTournamentAndRun,
  IServerTournamentPlayer,
  IServerTournamentDetails,
  IServerGame,
  handleSnapshotTournament,
} from "./lib";

import {
  getMaximumParticipants,
  getModeCost,
  getMaximumDuration,
  ERROR_ADVANCE_WITHOUT_ACTION,
  ERROR_NOT_YOUR_TURN,
  canRebuyInTournament,
  canTopUpInTournament,
  getBuyInAmountInTournament,
} from "../../engine/index";

import {
  getTabledPlayersInTournament,
  MAX_TABLE_SIZE,
} from "../../engine/tournament";
import { getTournamentFinalizeTime } from "../../utils/getTournamentFinalizeTime";
import { getCardsToShow } from "../../utils/getCardsToShow";
import { getLeastLoadedMediaServer, updateMediaServerHostTables, removeMediaServerHostTable } from "../mediasoup-hosts";

interface AuthenticatedRequest extends express.Request {
  user: { uid: string; name: string; email: string; picture: string };
}

type onCreateSubmitPayload = {
  title: string;
  date: Date;
  buyInAmount: number;
  bigBlindAmount: number;
  blindIncreaseDuration: number;
  emails: string;
  mode: GameMode;
  payType: PayType;
  selectedDate: Date;
  timeZone: string;
  // Tournament mode
  registrationMode?: TournamentRegistrationMode;
  winnerPayouts: number[];
  blindRounds: number[];
  roundInterval: number;
  rebuysThroughRound: number;
  startingStackAmount: number;
  type: GameType;
  branding: BrandingType;
  code: string;
  startDate: string;
  hostedMedia: string;
  topUpAmount: number;
  startTimerInSeconds?: number;
  rebuyTimeInSeconds?: number;
  roundBreakFinalRebuyTimeInSeconds?: number;
  eliminationHangTimeInSeconds?: number;
  lateRegistrationTimeInMinutes?: number;
  timeoutInSeconds?: number;
  minTableSizeBeforeRebalance?: number;
  externalVideoConferencingLink?: string;
  rebuyOptions: IRebuyOptions;

  // Debug
  version?: any;

  // Overflow
  enableOverflowRooms?: boolean;
  allowGuestsInOverflowRooms?: boolean;
  overflowRoomUrl?: string;

  // Better rebalances
  enablePerformantRebalances?: boolean;
  enablePlayerWelcomeVideos?: boolean;
  enableAutomation?: boolean;
};

/**
 * @swagger
 *  components:
 *    schemas:
 *     Tournament:
 *       type: object
 *       properties:
 *         id:
 *          type: string
 *         title:
 *          type: string
 *         buyInAmount:
 *          type: number
 *         emails:
 *          type: string
 *         mode:
 *          type: string
 *         type:
 *          type: string
 *         payType:
 *          type: string
 *         code: 
 *          type: string
 *         startDate:
 *          type: string
 *         timeZone:
 *          type: string      
 *         registrationMode:
 *          type: string
 *         winnerPayouts:
 *          type: string
 *         blindRounds:
 *          type: string
 *         roundInterval:
 *          type: number
 *         rebuysThroughRound:
 *          type: number
 *         startingStackAmount:
 *          type: number
 *         hostedMedia:
 *          type: string
 *         branding:
 *          type: string
 *         topUpAmount:
 *          type: number
 *         startTimerInSeconds:
 *          type: number
 *         rebuyTimeInSeconds:
 *          type: number
 *         roundBreakFinalRebuyTimeInSeconds:
 *          type: number
 *         eliminationHangTimeInSeconds:
 *          type: number
 *         lateRegistrationTimeInMinutes:
 *          type: number
 *         timeoutInSeconds:
 *          type: number
 *         minTableSizeBeforeRebalance:
 *          type: number
 *         externalVideoConferencingLink:
 *          type: string
 *         version:
 *          type: object
 *         enableOverflowRooms:
 *          type: boolean
 *         allowGuestsInOverflowRooms:
 *          type: boolean
 *         overflowRoomUrl:
 *          type: string
 *         rebuyOptions:
 *          type: string
 *         enablePerformantRebalances:
 *          type: boolean
 *         enablePlayerWelcomeVideos:
 *          type: boolean
 *         enableAutomation:
 *          type: boolean
 */
async function create(
  request: AuthenticatedRequest,
  response: express.Response,
  { db }: { db: FirebaseFirestore.Firestore }
) {
  const config = await loadConfig();
  try {
    const requestBody: onCreateSubmitPayload = JSON.parse(request.body);
    const {
      title = "Poker501 Tournament",
      buyInAmount = 20,
      emails = "",
      mode = GameMode.Premium_4_60,
      type = GameType.Cash,
      payType = PayType.UpFront,
      code,
      startDate = new Date().toISOString(),
      timeZone = "America/Los_Angeles",
      // Tournament
      registrationMode = TournamentRegistrationMode.Open,
      winnerPayouts,
      blindRounds,
      roundInterval,
      rebuysThroughRound,
      startingStackAmount,
      hostedMedia,
      branding,
      topUpAmount = 0,
      startTimerInSeconds,
      rebuyTimeInSeconds,
      roundBreakFinalRebuyTimeInSeconds,
      eliminationHangTimeInSeconds,
      lateRegistrationTimeInMinutes,
      timeoutInSeconds,
      minTableSizeBeforeRebalance,
      externalVideoConferencingLink = "",
      version = {},
      enableOverflowRooms = true,
      allowGuestsInOverflowRooms = true,
      overflowRoomUrl = "",
      rebuyOptions,
      enablePerformantRebalances = false,
      enablePlayerWelcomeVideos = false,
      enableAutomation = false,
    } = requestBody;

    const rootUrl = request.headers.origin || config.app.root_url;
    const detailsDoc = await typedDb
      .collection<IUserDetails>("users")
      .doc(request.user.uid)
      .get();
    const userDetails = detailsDoc.data() || {};

    const isMultiTable = type === GameType.MultiTableTournament;

    let tournamentDetails: Partial<IServerTournamentDetails> = {};
    let stack = startingStackAmount;

    const hasPlayerList =
      branding.playerListUrl && branding.playerListUrl.startsWith("http");
    let playerList: Partial<ITournamentRegistration>[] = [];
    if (hasPlayerList) {
      const data = stripBom(await (await fetch(branding.playerListUrl)).text());
      playerList = await new Promise((resolve, reject) => {
        CSVParse(data, (e, o) => {
          try {
            if (e) {
              reject(e);
              return;
            }

            const headers = o[0].map((h: string) => h.toLowerCase());
            const codeIndex = headers.findIndex(
              (h: string) => h.localeCompare("code") === 0
            );
            const nameIndex = headers.findIndex(
              (h: string) => h === "player name"
            );
            const tableIndex = headers.findIndex(
              (h: string) => h.localeCompare("table #") === 0
            );
            const stackIndex = headers.findIndex(
              (h: string) => h.localeCompare("stack") === 0
            );
            const emailIndex = headers.findIndex(
              (h: string) => h.localeCompare("email") === 0
            );
            const imageIndex = headers.findIndex(
              (h: string) => h.localeCompare("image") === 0
            );
            if (codeIndex < 0 || nameIndex < 0) {
              // Just not the right type of file
              reject(
                new Error("Could not find code or name column in CSV upload")
              );
              return;
            }
            const uploadedPlayers: Partial<ITournamentRegistration>[] = o
              .slice(1)
              .filter((row: string[]) => row[codeIndex])
              .map((row: string[]) => {
                // comment
                const user: Partial<ITournamentRegistration> = {
                  code: `${row[codeIndex]}`.toLowerCase(),
                  name: row[nameIndex],
                  suggestedTableIdentifier: row[tableIndex],
                  email: row[emailIndex],
                  image: row[imageIndex],
                  stack: row[stackIndex]
                    ? parseInt(row[stackIndex], 10)
                    : stack,
                };
                return user;
              });
            const groupedCodes = groupBy(
              (x: Partial<ITournamentRegistration>) => x.code
            )(uploadedPlayers);
            const duplicatedCodes = Object.values(groupedCodes).filter(
              (group) => group.length > 1
            );
            if (duplicatedCodes.length > 0) {
              throw new Error(
                `Found duplicate codes: ${duplicatedCodes.map(
                  (dupe) => dupe[0].code
                )}`
              );
            }
            resolve(uploadedPlayers);
          } catch (e) {
            reject(e);
          }
        });
      });
    }

    const players: Record<string, IServerTournamentPlayer> = {
      [request.user.uid]: {
        active: true,
        stack,
        contributed: buyInAmount,
        position: -1,
        id: request.user.uid,
        name: request.user.name || request.user.uid,
        email: request.user.email || "",
        photoURL: request.user.picture || "",
        role: PlayerRole.Organizer,
        rebuys: [],
        removed: isMultiTable, // Organizer is removed by default
        arrived: true,
      }
    };

    const hostNames: string[] = config.app.api_hostnames
      ? config.app.api_hostnames.split(",")
      : [];
    let apiServerHost: string = null;
    if (hostNames) {
      const activeHostedTournaments = await typedDb
        .collection<IServerTournamentDetails>("tournaments")
        .where("status", "in", [
          TournamentStatus.Active,
          TournamentStatus.AssigningTables,
          TournamentStatus.Initialized,
          TournamentStatus.PauseRequested,
          TournamentStatus.Paused,
        ])
        .select("apiServerHost")
        .get();

      const hosts = activeHostedTournaments.docs
        .map((d) => d.data().apiServerHost)
        .reduce((map, host) => {
          if (!map[host]) map[host] = 0;
          map[host]++;
          return map;
        }, {} as { [key: string]: number });
      apiServerHost =
        hostNames.sort((h1, h2) => (hosts[h1] || 0) - (hosts[h2] || 0))[0] ||
        null;
    }

    tournamentDetails = {
      name: title,
      rounds: blindRounds.map((r, index) => ({
        id: index,
        roundIndex: index,
        bigBlind: r,
      })),
      registrationMode: hasPlayerList
        ? TournamentRegistrationMode.Code
        : registrationMode,
      ...playerList?.length && { registrationsCount: playerList.length },
      roundInterval: roundInterval,
      startingStack: startingStackAmount,
      winners: winnerPayouts.map((p, index) => ({ rank: index, percent: p })),
      rebuysThroughRound: rebuysThroughRound,
      tables: [],
      players,
      buyIn: buyInAmount,
      type,
      mode,
      status: TournamentStatus.Initialized,
      organizerId: request.user.uid,
      prng: "mulberry32",
      hostedMedia: hostedMedia || config.app.default_hosted_media,
      organizerCode: "nicholas123",
      branding: branding || {},
      topUpAmount,
      startTimerInSeconds,
      rebuyTimeInSeconds,
      roundBreakFinalRebuyTimeInSeconds,
      eliminationHangTimeInSeconds,
      lateRegistrationTimeInMinutes,
      timeoutInSeconds,
      minTableSizeBeforeRebalance,
      externalVideoConferencingLink,
      startDate,
      rebuyOptions,

      // Overflow,
      enableOverflowRooms,
      allowGuestsInOverflowRooms,
      overflowRoomUrl,

      // Better rebalances
      enablePerformantRebalances,

      // Welcome videos
      enablePlayerWelcomeVideos,

      enableAutomation,

      // Debug
      clientVersion: version,
      serverVersion: config.app.version || "unknown",
      managed: cache.isEnabled(),

      apiServerHost,
      organizerIds: [request.user.uid],
    };
    stack = startingStackAmount;

    // Create the tournament here - jumbo waiting room of names?

    const tournamentDoc = await typedDb
      .collection<IServerTournamentDetails>("tournaments")
      .add({
        ...tournamentDetails,
      });

    if (playerList && playerList.length) {
      const tournamentData = (await tournamentDoc.get()).data();
      tournamentData.id = tournamentDoc.id;
      await createRegistrations(tournamentData, playerList, true);
    }

    const inviteEmails = emails.split(/;|,/g).filter((e) => e);
    if (!isMultiTable && inviteEmails.length) {
      sendInvite(
        [...inviteEmails, request.user.email].filter((e) => e),
        request.user,
        tournamentDoc.id,
        title,
        startDate,
        timeZone,
        mode,
        rootUrl,
        `${rootUrl}/tournament/${tournamentDoc.id}?join`
      );
    } else {
      // Just let me know there is a tournament
      sendInvite(
        ["nick@pokerinplace.app"].filter((e) => e),
        request.user,
        tournamentDoc.id,
        title,
        startDate,
        timeZone,
        mode,
        rootUrl,
        `${rootUrl}/tournament/${tournamentDoc.id}?join`
      );
    }

    // TODO - verify the subscription here - or just add a worker
    let paymentSessionId;
    const cost = getModeCost(
      mode,
      PayType.UpFront,
      userDetails.subscriptionType
    );

    // Allow lots of free ones
    if (cost === 0) {
      const isFree = getModeCost(mode, PayType.UpFront) === 0;
      await tournamentDoc.update({
        id: tournamentDoc.id,
        paymentId: isFree ? "free" : userDetails.subscription,
        paymentType: isFree ? "free" : "subscription",
      });
    } else {
      const promoCode = code;
      if (promoCode) {
        const promoCodeDoc = await typedDb
          .collection<ICode>("codes")
          .doc(code)
          .get();
        if (!promoCodeDoc.data()) {
          return response.json({ error: "Invalid promo code" });
        } else if (promoCodeDoc.data()?.redeemedBy) {
          return response.json({ error: "Promo code already redeemed" });
        }
        await promoCodeDoc.update({
          redeemedBy: request.user.uid,
          redeemedAt: new Date().toISOString(),
        });
      }
      if (promoCode) {
        await tournamentDoc.update({
          id: tournamentDoc.id,
          paymentId: promoCode,
        });
      } else {
        if (payType === "up-front") {
          let customer;
          try {
            customer = await createCustomer(
              request.user.name,
              request.user.email
            );
          } catch (e) {
            //
          }
          const stripeClient = await getStripeClient(request.headers.domain);
          const session = await stripeClient.checkout.sessions.create({
            customer: customer ? customer.id : undefined,
            customer_email: customer ? undefined : request.user.email,
            payment_method_types: ["card"],
            line_items: [
              {
                name: "Poker501 Premium Game",
                description: `Up to ${getMaximumParticipants(
                  mode
                )} players for up to ${getMaximumDuration(mode) / 60} minutes`,
                images: [`${rootUrl}/logo-256.png`],
                amount: cost * 100, // pennies
                currency: "usd",
                quantity: 1,
              },
            ],
            success_url: `${rootUrl}/tournament/${tournamentDoc.id}?join&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${rootUrl}/?cancel`,
          });
          paymentSessionId = session.id;
          await tournamentDoc.update({
            id: tournamentDoc.id,
            paymentSessionId,
          });
        }
      }
    }

    return response.json({
      id: tournamentDoc.id,
      paymentSessionId,
    });
  } catch (e) {
    return response.status(500).json({ error: (e as any).message });
  }
}

type onEditSubmitPayload = { id: string, tournamentId: string; } & Omit<
  onCreateSubmitPayload,
  "mode" | "type" | "payType" | "code"
>;

/**
 * @swagger
 *
 * /tournament/edit:
 *   post:
 *     tags: [Tournaments]
 *     produces:
 *       - application/json
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Tournament'
 *     responses:
 *         200:
 *           description: An object with tournament id after editing a tournament
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   id: 
 *                    type: string
 */
async function edit(
  request: AuthenticatedRequest,
  response: express.Response,
  { getTournament }: { getTournament: GetTournamentFunction }
) {
  const config = await loadConfig();
  const requestBody: onEditSubmitPayload = JSON.parse(request.body);
  await lockTournamentAndRun(requestBody.id, null, async () => {
    const tournamentDoc = await typedDb
      .collection<IServerTournamentDetails>("tournaments")
      .doc(requestBody.id)
      .get();
    if (!tournamentDoc) {
      return response.status(403).json({ error: "Unauthorized" });
    }
    const tournamentData = tournamentDoc.data();
    // TODO - add permissions here
    if (tournamentData.status !== TournamentStatus.Initialized) {
      return response.status(403).json({ error: "Unauthorized" });
    }
    const {
      title = "Poker501 Tournament",
      buyInAmount = 20,
      // emails = "",
      startDate = new Date().toISOString(),
      // timeZone = "America/Los_Angeles",
      // Tournament
      registrationMode = TournamentRegistrationMode.Open,
      winnerPayouts,
      blindRounds,
      roundInterval,
      rebuysThroughRound,
      startingStackAmount,
      // hostedMedia,
      branding,
      topUpAmount = 0,
      startTimerInSeconds,
      rebuyTimeInSeconds,
      roundBreakFinalRebuyTimeInSeconds,
      eliminationHangTimeInSeconds,
      lateRegistrationTimeInMinutes,
      timeoutInSeconds,
      minTableSizeBeforeRebalance,
      externalVideoConferencingLink = "",
      version = {},
      enableOverflowRooms = true,
      allowGuestsInOverflowRooms = true,
      overflowRoomUrl = "",
      rebuyOptions,
      enablePerformantRebalances,
      enablePlayerWelcomeVideos,
      enableAutomation,
    } = requestBody;

    const isMultiTable = tournamentData.type === GameType.MultiTableTournament;

    const stack = startingStackAmount;
    const additionalPlayers: { [key: string]: ITournamentPlayer } = {};

    // Uploaded a new player list
    const hasPlayerList =
      branding.playerListUrl &&
      branding.playerListUrl.startsWith("http") &&
      branding.playerListUrl !== tournamentData.branding?.playerListUrl;
    let playerList: Partial<ITournamentRegistration>[] = [];
    if (hasPlayerList) {
      const data = stripBom(await (await fetch(branding.playerListUrl)).text());
      playerList = await new Promise((resolve, reject) => {
        CSVParse(data, (e, o) => {
          try {
            if (e) {
              reject(e);
              return;
            }

            const headers = o[0].map((h: string) => h.toLowerCase());
            const codeIndex = headers.findIndex(
              (h: string) => h.localeCompare("code") === 0
            );
            const nameIndex = headers.findIndex(
              (h: string) => h === "player name"
            );
            const tableIndex = headers.findIndex(
              (h: string) => h.localeCompare("table #") === 0
            );
            const emailIndex = headers.findIndex(
              (h: string) => h.localeCompare("email") === 0
            );
            const imageIndex = headers.findIndex(
              (h: string) => h.localeCompare("image") === 0
            );
            const stackIndex = headers.findIndex(
              (h: string) => h.localeCompare("stack") === 0
            );
            if (codeIndex < 0 || nameIndex < 0) {
              // Just not the right type of file
              reject(
                new Error("Could not find code or name column in CSV upload")
              );
              return;
            }
            resolve(
              o.slice(1).map((row: string[]) => {
                // comment
                const user: Partial<ITournamentRegistration> = {
                  code: `${row[codeIndex]}`.toLowerCase(),
                  name: row[nameIndex],
                  suggestedTableIdentifier: row[tableIndex],
                  email: row[emailIndex],
                  image: row[imageIndex],
                  stack: row[stackIndex]
                    ? parseInt(row[stackIndex], 10)
                    : stack,
                };
                return user;
              })
            );
          } catch (e) {
            reject(e);
          }
        });
      });
    }

    const players =
      isMultiTable && false
        ? { ...additionalPlayers }
        : {
          [request.user.uid]: {
            active: true,
            stack,
            contributed: buyInAmount,
            position: -1,
            id: request.user.uid,
            name: request.user.name || request.user.uid,
            email: request.user.email || "",
            photoURL: request.user.picture || "",
            role: PlayerRole.Organizer,
            rebuys: [],
            removed: isMultiTable, // Organizer is removed by default
            arrived: true,
          },
          ...additionalPlayers,
        };

    await tournamentDoc.update({
      name: title,
      rounds: blindRounds.map((r, index) => ({
        id: index,
        roundIndex: index,
        bigBlind: r,
      })),
      registrationMode: hasPlayerList
        ? TournamentRegistrationMode.Code
        : registrationMode,
      roundInterval: roundInterval,
      startingStack: startingStackAmount,
      winners: winnerPayouts.map((p, index) => ({ rank: index, percent: p })),
      rebuysThroughRound: rebuysThroughRound,
      tables: [],
      players,
      buyIn: buyInAmount,
      status: TournamentStatus.Initialized,
      organizerId: request.user.uid,
      branding: branding || {},
      topUpAmount,
      startTimerInSeconds,
      rebuyTimeInSeconds,
      roundBreakFinalRebuyTimeInSeconds,
      eliminationHangTimeInSeconds,
      lateRegistrationTimeInMinutes,
      timeoutInSeconds,
      minTableSizeBeforeRebalance,
      externalVideoConferencingLink,
      startDate,
      rebuyOptions,

      // Overflow,
      enableOverflowRooms,
      allowGuestsInOverflowRooms,
      overflowRoomUrl,

      // Better rebalances
      enablePerformantRebalances,

      // Welcome messages
      enablePlayerWelcomeVideos,

      enableAutomation,

      // Debug
      clientVersion: version,
      serverVersion: config.app.version || "unknown",
      managed: cache.isEnabled(),
    });

    if (playerList && playerList.length) {
      const updatedTournamentData = (await tournamentDoc.get()).data();
      updatedTournamentData.id = tournamentDoc.id;
      await createRegistrations(updatedTournamentData, playerList, true);
    }

    return response.json({
      id: tournamentDoc.id,
    });
  });
}

/**
 * @swagger
 *
 * /tournament/update:
 *   put:
 *     tags: [Tournaments]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: tournamentId
 *         in: body
 *         required: true
 *         type: string
 *       - name: updatedValues
 *         in: body
 *         schema:
 *           $ref: '#/components/schemas/Tournament'          
 *     responses:
 *         200:
 *           description: An object with tournament id after updating the tournament
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   id: 
 *                    type: string
 *         403:
 *           description: Something went wrong
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   error: 
 *                    type: string
 */
async function update(
  request: AuthenticatedRequest,
  response: express.Response,
) {
  const requestBody: onEditSubmitPayload = JSON.parse(request.body);
  const { tournamentId, ...updatedValues } = requestBody;

  await lockTournamentAndRun(tournamentId, null, async () => {
    const tournamentDoc = await typedDb
      .collection<IServerTournamentDetails>("tournaments")
      .doc(tournamentId)
      .get();
    if (!tournamentDoc) {
      return response.status(403).json({ error: "Unauthorized" });
    }

    const tournamentData = tournamentDoc.data();

    if (tournamentData.status !== TournamentStatus.Initialized) {
      return response.status(403).json({ error: "Unauthorized" });
    }

    // ToDo: Add pemissions check

    await tournamentDoc.update(updatedValues);

    return response.json({
      id: tournamentDoc.id,
    });
  });
}

/**
 * @swagger
 *
 * /tournament/respond:
 *   post:
 *     tags: [Tournaments]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: tournamentId
 *         in: body
 *         required: true
 *         type: string
 *       - name: tableId
 *         in: body
 *         required: true
 *         type: string
 *       - name: action
 *         in: body
 *         required: true
 *         type: string
 *       - name: amount
 *         in: body
 *         required: true
 *         type: number
 *       - name: puppetUid
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *         500:
 *          description: Internal server error
 *         200:
 *           description: An object with  after response to  a tournament
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   respond: 
 *                    type: boolean
 *                   autoAdvanceDuration:
 *                     type: string
 *                   gameDirective:
 *                     type: string
 */
async function respond(
  request: AuthenticatedRequest,
  response: express.Response,
  { getTournament }: { getTournament: GetTournamentFunction }
) {
  const { tournamentId, tableId, action, amount, puppetUid } = JSON.parse(
    request.body
  );
  const uid = request.user.uid;

  if (!puppetUid) {
    return respondTournament({ tournamentId, tableId, action, amount, uid }, response)
  }

  const { tournament: tournamentDoc } = await getTournament(tournamentId, {
    includeTables: false,
  });

  const { enableAutomation, organizerIds } = tournamentDoc.data();

  if (enableAutomation && organizerIds.includes(uid)) {
    return respondTournament({ tournamentId, tableId, action, amount, uid: puppetUid }, response)
  }

  return response.status(500);
}

interface IRespondTournamentParams {
  tournamentId: string,
  tableId: string,
  action: ActionDirective;
  amount: number,
  uid: string;
}

async function respondTournament(
  { tournamentId, tableId, action, amount, uid }: IRespondTournamentParams,
  response: express.Response
) {
  try {
    const updates = await respondAndAdvanceTournamentHand(
      tournamentId,
      tableId,
      uid,
      action,
      amount
    );

    if (
      updates?.gameUpdates?.error &&
      ![ERROR_ADVANCE_WITHOUT_ACTION, ERROR_NOT_YOUR_TURN].includes(updates.gameUpdates.error)
    ) {
      return response.status(500).json({ error: updates.gameUpdates.error });
    }

    return response.json({
      respond: true,
      autoAdvanceDuration: updates?.tournamentUpdates?.autoAdvanceDuration,
      gameDirective: updates?.gameUpdates?.directive,
    });
  } catch (e) {
    logger.exception(e);
    // Don't log these errors
    if ([ERROR_ADVANCE_WITHOUT_ACTION, ERROR_NOT_YOUR_TURN].includes((e as any).message)) {
      return response.status(200).json({});
    }
    return response.status(500).json({ error: (e as any).message });
  }
}

/**
 * @swagger
 *
 * /tournament/flip:
 *   post:
 *     tags: [Tournaments]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: tournamentId
 *         in: body
 *         required: true
 *         type: string
 *       - name: tableId
 *         in: body
 *         required: true
 *         type: string
 *       - name: handId
 *         in: body
 *         required: true
 *         type: string
 *       - name: show
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *         500:
 *           description: Internal server error
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   error: 
 *                    type: string
 *         200:
 *           description: An object with boolean value after fliping the tournament
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   error: 
 *                    type: string
 */
async function flip(
  request: AuthenticatedRequest,
  response: express.Response,
  {
    getTournament,
  }: { db: FirebaseFirestore.Firestore; getTournament: GetTournamentFunction }
) {
  const { show, tournamentId, tableId, handId } = JSON.parse(request.body);

  await lockTournamentAndRun(tournamentId, tableId, async () => {
    const hand = await typedDb
      .collection<IGame>("tables")
      .doc(tableId)
      .collection<IHand>("hands")
      .doc(handId)
      .get();

    if (!hand) {
      return response.status(500).json({ error: "Hand not found" });
    }

    const playerState = await typedDb
      .collection<IGame>("tables")
      .doc(tableId)
      .collection<IHand>("hands")
      .doc(handId)
      .collection<IPlayerState>("players")
      .doc(request.user.uid)
      .get();

    if (!playerState) {
      return response.status(500).json({ error: "Hand state not found" });
    }
    const shownCards = hand.data().shownCards || [];

    if (shownCards.some(({ uid }) => uid === request.user.uid)) {
      return response.json({ error: null });
    }

    await hand.update({
      shownCards: [
        ...shownCards,
        {
          cards: getCardsToShow({ cards: playerState.data().cards, show }),
          uid: request.user.uid,
        },
      ],
    });

    return response.json({ error: null });
  });
}

/**
 * @swagger
 *
 * /tournament/enroll:
 *   post:
 *     tags: [Tournaments]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: tournamentId
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *         200:
 *           description: An object with boolean value indicating successful enrollment to tournament
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   enrolled: 
 *                    type: boolean
 */
async function enroll(
  request: AuthenticatedRequest,
  response: express.Response,
  {
    getTournament,
  }: { db: FirebaseFirestore.Firestore; getTournament: GetTournamentFunction }
) {
  const { tournamentId } = JSON.parse(request.body);

  await lockTournamentAndRun(tournamentId, null, async () => {
    const { tournament: tournamentDoc } = await getTournament(tournamentId, {
      includeTables: false,
    });
    if (!tournamentDoc) {
      return response.status(403).json({ error: "Unauthorized" });
    }
    const tournamentData = tournamentDoc.data();
    if (tournamentData.status !== TournamentStatus.Initialized) {
      return response.status(403).json({ error: "Unauthorized" });
    }

    const registrationsWithCode = (
      await typedDb
        .collection<ITournamentDetails>("tournaments")
        .doc(tournamentId)
        .collection<ITournamentRegistration>("registrants")
        .where("enrolled", "==", false)
        .get()
    ).docs;

    const updates: any = {};
    const position = -1;

    const buyIn = tournamentData.buyIn;
    const stack = tournamentData.startingStack;
    for (const reg of registrationsWithCode.filter((r) => !r.data().enrolled)) {
      const rData = reg.data();
      const existingPlayer = tournamentData.players[`players.${rData.secret}`];
      updates[`players.${rData.secret}`] = {
        active: true,
        stack: rData.stack || stack,
        contributed: buyIn,
        position,
        id: rData.secret,
        name: rData.name,
        email: rData.email,
        photoURL: "",
        role: existingPlayer ? existingPlayer.role : PlayerRole.Player,
        removed: false,
      };
      await reg.update({ enrolled: true });
    }

    await tournamentDoc.update(updates);
    return response.json({ enrolled: true });
  });
}

async function createRegistrations(
  tournament: ITournamentDetails,
  registrations: Partial<ITournamentRegistration>[],
  autoEnroll: boolean,
  firebaseBatch: FirebaseTypedWriteBatch = typedDb.batch()
) {
  const updates: any = {};
  for (const registration of registrations) {
    const code = registration.code || tinyUid(5);
    const secret = tinyUid(25);
    await firebaseBatch.set<ITournamentRegistration>(
      typedDb
        .collection<ITournamentDetails>("tournaments")
        .doc(tournament.id)
        .collection<ITournamentRegistration>("registrants")
        .doc(code),
      {
        name: registration.name || "",
        venmo: registration.venmo || "",
        paypal: registration.paypal || "",
        phone: registration.phone || "",
        email: registration.email || "",
        suggestedTableIdentifier: registration.suggestedTableIdentifier || "",
        image: registration.image || "",
        code,
        enrolled: autoEnroll,
        created: new Date().getTime(),
        secret,
        timestamp: new Date().getTime(),
      }
    );
    if (autoEnroll) {
      updates[`players.${secret}`] = {
        active: true,
        stack: registration.stack || tournament.startingStack,
        contributed: tournament.buyIn,
        position: -1,
        id: secret,
        name: registration.name || "",
        email: registration.email || "",
        suggestedTableIdentifier: registration.suggestedTableIdentifier || "",
        photoURL: registration.image || "",
        role: PlayerRole.Player,
        removed: false,
        arrived: false,
      };
    }
  }
  if (autoEnroll) {
    await firebaseBatch.update<ITournamentDetails>(
      typedDb.collection<ITournamentDetails>("tournaments").doc(tournament.id),
      updates
    );
  }

  await firebaseBatch.commit();
}

/**
 * @swagger
 *
 * /tournament/register:
 *   post:
 *     tags: [Tournaments]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: tournamentId
 *         in: body
 *         required: true
 *         type: string
 *       - name: name
 *         in: body
 *         type: string
 *       - name: venmo
 *         in: body
 *         type: string
 *       - name: paypal
 *         in: body
 *         type: string
 *       - name: phone
 *         in: body
 *         type: string
 *       - name: email
 *         in: body
 *         type: string
 *     responses:
 *         200:
 *           description: An object with boolean value indicating successful registeration to tournament
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   registered: 
 *                    type: boolean
 */
async function register(
  request: AuthenticatedRequest,
  response: express.Response,
  {
    getTournament,
  }: { db: FirebaseFirestore.Firestore; getTournament: GetTournamentFunction }
) {
  const {
    tournamentId,
    name = "",
    venmo = "",
    paypal = "",
    phone = "",
    email = "",
  } = JSON.parse(request.body);

  await lockTournamentAndRun(tournamentId, null, async () => {
    const { tournament: tournamentDoc } = await getTournament(tournamentId, {
      includeTables: false,
    });
    if (!tournamentDoc) {
      return response.status(403).json({ error: "Unauthorized" });
    }

    const registrantRef = typedDb
      .collection<ITournamentDetails>("tournaments")
      .doc(tournamentDoc.id)
      .collection<ITournamentRegistration>("registrants")
      .doc(request.user.uid);

    const isAlreadyJoined = (await registrantRef.get()).exists;

    if (!isAlreadyJoined) {
      await createRegistrations(
        tournamentDoc.data(),
        [
          {
            name,
            venmo,
            paypal,
            phone,
            email,
          },
        ],
        true
      );
    }
    return response.json({
      registered: true,
    });
  });
}

/**
 * @swagger
 *
 * /tournament/leave:
 *   post:
 *     tags: [Tournaments]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: tournamentId
 *         in: body
 *         required: true
 *         type: string
 *       - name: playerId
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *         200:
 *           description: An object with  after leaving a tournament
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   leave: 
 *                    type: boolean
 */
async function leave(
  request: AuthenticatedRequest,
  response: express.Response,
  {
    getTournament,
  }: { db: FirebaseFirestore.Firestore; getTournament: GetTournamentFunction }
) {
  const { tournamentId, playerId } = JSON.parse(request.body);

  await lockTournamentAndRun(tournamentId, null, async () => {
    const { tournament: tournamentDoc, tables: tableDocs } =
      await getTournament(tournamentId, {
        includeTables: true,
        currentUserId: playerId,
      });
    if (!tournamentDoc) {
      return response.status(403).json({ error: "Unauthorized" });
    }
    const tournamentData = tournamentDoc.data();
    const userId = playerId || request.user.uid;

    if (tournamentData.status === TournamentStatus.Initialized) {
      // TODO - if we are using codes, don't set as removed
      if (tournamentData.registrationMode === TournamentRegistrationMode.Code) {
        await tournamentDoc.update({
          [`players.${userId}.active`]: false,
          [`players.${userId}.away`]: true,
        });
      } else {
        await tournamentDoc.update({
          [`players.${userId}.active`]: false,
          [`players.${userId}.removed`]: true,
          [`players.${userId}.away`]: true,
        });
      }
    } else {
      const tableId = tournamentData.players[userId]
        ? tournamentData.players[userId].tableId
        : null;
      const tableDoc = tableDocs.docs.find((t) => t.id === tableId);
      const tableData = tableDoc ? tableDoc.data() : null;
      if (!tableData || !tableData.players[userId]) {
        return response.status(403).json({ error: "Unauthorized" });
      }

      const propertyToUpdate = {
        [`players.${userId}.away`]: true,
      };

      // Lock the table and fix up the player
      const tableLockName = `tournament.${tournamentId}.table.${tableId}`;
      await acquireLockAndExecute(
        tableLockName,
        async () => {
          await tableDoc.update(propertyToUpdate);
        },
        "leave"
      );
      await tournamentDoc.update(propertyToUpdate);
    }

    return response.json({
      leave: true,
    });
  });
}

/**
 * @swagger
 *
 * /tournament/away:
 *   post:
 *     tags: [Tournaments]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: tournamentId
 *         in: body
 *         required: true
 *         type: string
 *       - name: playerId
 *         in: body
 *         required: true
 *         type: string
 *       - name: away
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *         200:
 *           description: An object with  after away from  a tournament
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   away: 
 *                    type: boolean
 */
async function away(
  request: AuthenticatedRequest,
  response: express.Response,
  {
    getTournament,
  }: { db: FirebaseFirestore.Firestore; getTournament: GetTournamentFunction }
) {
  const { tournamentId, playerId, away: isAway } = JSON.parse(request.body);

  const { tournament: baseTournamentDoc } = await getTournament(tournamentId, {
    includeTables: false,
  });

  const userId = playerId || request.user.uid;
  const baseTableId = baseTournamentDoc.data().players[userId]?.tableId;

  await lockTournamentAndRun(
    tournamentId,
    baseTableId,
    async () => {
      const { tournament: tournamentDoc, tables: tableDocs } =
        await getTournament(tournamentId, {
          includeTables: true,
          currentUserId: userId,
        });
      if (!tournamentDoc) {
        return response.status(403).json({ error: "Unauthorized" });
      }
      const tournamentData = tournamentDoc.data();

      // TODO - there seems to be a bug there a player is "away" at a table
      // but can't observe a table because their record says away

      const tableId = tournamentData.players[userId]
        ? tournamentData.players[userId].tableId
        : null;
      const tableDoc = tableDocs.docs.find((t) => t.id === tableId);
      const tableData = tableDoc ? tableDoc.data() : null;
      if (!tableData || !tableData.players[userId]) {
        return response.status(403).json({ error: "Unauthorized" });
      }

      const propertyToUpdate = {
        [`players.${userId}.away`]: isAway,
      };

      // Lock the table and fix up the player
      await tableDoc.update(propertyToUpdate);
      await tournamentDoc.update(propertyToUpdate);

      return response.json({
        away,
      });
    },
    "away"
  );
}

async function removePlayers(
  tournamentId: string,
  playerIds: string[],
  { getTournament }: { getTournament: GetTournamentFunction }
) {
  let singlePlayerTableId: string = null;
  if (playerIds.length === 1) {
    // Pause the actual table
    const { tournament: tournamentDoc } = await getTournament(tournamentId, {
      includeTables: false,
    });
    singlePlayerTableId = tournamentDoc.data().players[playerIds[0]].tableId;
  }
  await lockTournamentAndRun(tournamentId, singlePlayerTableId, async () => {
    const { tournament: tournamentDoc, tables: tableDocs } =
      await getTournament(tournamentId, {
        includeTables: true,
        currentUserId: playerIds.length === 1 ? playerIds[0] : null,
      });
    if (!tournamentDoc) {
      throw new Error("Unauthorized");
    }
    const tournamentData = tournamentDoc.data();

    const batch = typedDb.batch();
    let updates: any = {};

    for (const playerId of playerIds) {
      const userId = playerId;
      const tableId = tournamentData.players[userId]
        ? tournamentData.players[userId].tableId
        : null;

      const removalOptions =
        tournamentData.status !== TournamentStatus.Initialized
          ? {
            [`players.${userId}.rebuyDeclined`]: true,
            [`players.${userId}.willRemove`]: true,
          }
          : { [`players.${userId}.removed`]: true };

      if (tableId) {
        const tableDoc = tableDocs.docs.find((t) => t.id === tableId);
        const tableData = tableDoc.data();

        if (
          !tableData ||
          !tableData.players[userId] ||
          !tableData.players[userId]
        ) {
          continue;
        }

        await batch.update<IGame>(tableDoc.ref, {
          [`players.${userId}.active`]: false,
          [`players.${userId}.bustedTimestamp`]: new Date().getTime(),
          ...removalOptions,
        });
      }
      updates = {
        ...updates,
        [`players.${userId}.active`]: false,
        [`players.${userId}.bustedTimestamp`]: new Date().getTime(),
        ...removalOptions,
      };
    }
    await batch.update<ITournamentDetails>(tournamentDoc.ref, updates);
    await batch.commit();
  });
  // TODO - we need to remove tables that have no active players now
  // await respondAndAdvanceTournamentHand(tournamentId, null, null, null, null);
}

/**
 * @swagger
 *
 * /tournament/remove:
 *   post:
 *     tags: [Tournaments]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: tournamentId
 *         in: body
 *         required: true
 *         type: string
 *       - name: playerId
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
 *         200:
 *           description: An object with boolean value after removing palyer from tournament
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   remove: 
 *                    type: boolean
 */
async function remove(
  request: AuthenticatedRequest,
  response: express.Response,
  {
    getTournament,
  }: { db: FirebaseFirestore.Firestore; getTournament: GetTournamentFunction }
) {
  const { tournamentId, playerId } = JSON.parse(request.body);

  try {
    await removePlayers(tournamentId, [playerId], { getTournament });
    return response.json({
      remove: true,
    });
  } catch (e) {
    return response.status(403).json({ error: (e as any).message });
  }
}

/**
 * @swagger
 *
 * /tournament/profile:
 *   post:
 *     tags: [Tournaments]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: tournamentId
 *         in: body
 *         required: true
 *         type: string
 *       - name: welcomeMessageUrl
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *         200:
 *           description: An object with boolean value indicating successful profiling of tournament
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   welcomeMessageUrl: 
 *                    type: string
 *         403:
 *           description: Something went wrong
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   error: 
 *                    type: string
 */
async function profile(
  request: AuthenticatedRequest,
  response: express.Response,
  {
    getTournament,
  }: { db: FirebaseFirestore.Firestore; getTournament: GetTournamentFunction }
) {
  const { tournamentId, welcomeMessageUrl } = JSON.parse(request.body);

  try {
    const { tournament } = await getTournament(tournamentId as string, {
      includeTables: false,
    });

    const tournamentData = tournament.data();

    if (tournamentData.status !== TournamentStatus.Initialized) {
      return response
        .status(403)
        .json({ error: "Tournament is not initialized" });
    }
    if (
      !tournamentData.players[request.user.uid] ||
      tournamentData.players[request.user.uid].welcomeMessageUrl
    ) {
      return response.status(403).json({ error: "Access denied" });
    }

    await tournament.update({
      [`players.${request.user.uid}.welcomeMessageUrl`]: welcomeMessageUrl,
    });

    return response.json({
      welcomeMessageUrl,
    });
  } catch (e) {
    return response.status(403).json({ error: (e as any).message });
  }
}

async function createTable({
  name,
  players,
  buyIn,
  organizerId,
  tournamentData,
  stage = GameStage.Active,
}: {
  name: string;
  players: IPlayer[];
  buyIn: number;
  organizerId: string;
  tournamentData: ITournamentDetails;
  stage?: GameStage;
}) {
  const config = await loadConfig();
  const leastLoadedHost = await getLeastLoadedMediaServer();

  const defaultHostedMedia = config.app.default_hosted_media;

  const mediaSoupHostNames = (config.app.mediasoup_hostnames || "").split(",");
  const index = Math.floor(Math.random() * mediaSoupHostNames.length);

  const mediasoupHost = leastLoadedHost
    ? `${leastLoadedHost}.media.pokerinplace.app`
    : mediaSoupHostNames[index]

  const tableDoc = await typedDb.collection<IServerGame>("tables").add({
    tournamentId: tournamentData.id,
    timestamp: new Date().getTime(),
    name,
    players: players.reduce(
      (map, player) => ({ ...map, [player.id]: player }),
      {}
    ),
    buyIn,
    increment: 1,
    type: GameType.Tournament,
    stage: GameStage.Active,
    prng: "mulberry32",
    hostedMedia: defaultHostedMedia,
    organizerId,
    mediasoupHost,
    branding: tournamentData.branding || {},
    features: { autoFlipEnabled: true },
    apiServerHost: tournamentData.apiServerHost || null,
    currentBigBlind: tournamentData.rounds[0].bigBlind,
    ...leastLoadedHost && { smartMediasoupHost: leastLoadedHost },
    ...tournamentData.enableAutomation && { enableAutomation: tournamentData.enableAutomation }
  });

  if (leastLoadedHost) {
    const table = await tableDoc.get()
    await updateMediaServerHostTables({ host: leastLoadedHost, tableId: table.id });
  }
  return tableDoc;
}

/**
 * @swagger
 *
 * /tournament/start:
 *   post:
 *     tags: [Tournaments]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: tournamentId
 *         in: body
 *         required: true
 *         type: string
 *       - name: pauseMessage
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *         200:
 *           description: An object with boolean value and warning message after starting a message
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   started: 
 *                    type: boolean
 *                   warning: 
 *                    type: string
 */
async function start(
  request: AuthenticatedRequest,
  response: express.Response,
  {
    getTournament,
  }: { db: FirebaseFirestore.Firestore; getTournament: GetTournamentFunction }
) {
  const { tournamentId, pauseMessage } = JSON.parse(request.body);

  await lockTournamentAndRun(tournamentId, null, async () => {
    const { tournament: tournamentDoc } = await getTournament(tournamentId);
    if (!tournamentDoc) {
      return response.status(403).json({ error: "Unauthorized" });
    }

    const tournamentData = tournamentDoc.data();
    if (tournamentData.status !== TournamentStatus.Initialized) {
      return response.status(403).json({
        error: "Unauthorized",
      });
    }

    const tabledPlayers: IServerTournamentPlayer[] =
      getTabledPlayersInTournament(tournamentData);
    if (tabledPlayers.length <= 1) {
      return response.json({
        error: "Need at least 2 players to begin",
      });
    }

    const startTimerInSeconds = tournamentData.startTimerInSeconds || 30;
    if (startTimerInSeconds) {
      if (!tournamentData.startTime) {
        const startTime = new Date().getTime() + startTimerInSeconds * 1000;
        await tournamentDoc.update({
          startTime,
          startPauseMessage: pauseMessage || "",
        });
        return response.json({
          startTime: startTime,
        });
      } else if (tournamentData.startTime > new Date().getTime()) {
        return response.json({
          startTime: tournamentData.startTime,
        });
      }
    }

    // We need to shuffle players and assign to tables
    let maxPlayersPerTable = MAX_TABLE_SIZE;
    let requiredTables = Math.ceil(tabledPlayers.length / maxPlayersPerTable);
    // 12 ... 12 / 8 = 2
    // 12 / 2 = 6
    let tableWithPlayers: {
      players: IServerTournamentPlayer[];
      name: string;
    }[] = [];

    const playersWithTableAssignments: IServerTournamentPlayer[] =
      tabledPlayers.filter(
        (p: IServerTournamentPlayer) => !!p.suggestedTableIdentifier
      );

    let tableIdentifiers: string[] = [];
    let warningError = "";

    if (playersWithTableAssignments.length) {
      // Allow for min tables based on the min table size
      maxPlayersPerTable = tournamentData.minTableSizeBeforeRebalance ?? 8;
      let requiredPreassignedTables = Math.ceil(
        playersWithTableAssignments.length / maxPlayersPerTable
      );
      const tablePreAssignments = groupBy<IServerTournamentPlayer>(
        (p) => p.suggestedTableIdentifier
      )(playersWithTableAssignments);
      tableIdentifiers = Object.keys(tablePreAssignments);
      if (tableIdentifiers.length > requiredPreassignedTables) {
        warningError =
          "Too many tables required - Rebalancing will combine tables.";
        requiredPreassignedTables = tableIdentifiers.length;
      } else if (tableIdentifiers.length < requiredPreassignedTables) {
        // Just required the number of assigned tables
        requiredPreassignedTables = tableIdentifiers.length;
      }

      for (let i = 0; i < playersWithTableAssignments.length; ++i) {
        const tableIdentifier =
          playersWithTableAssignments[i].suggestedTableIdentifier;
        const tableIndex = tableIdentifiers.indexOf(tableIdentifier);
        if (!tableWithPlayers[tableIndex])
          tableWithPlayers[tableIndex] = { players: [], name: tableIdentifier };
        if (tableWithPlayers[tableIndex].players.length >= MAX_TABLE_SIZE) {
          // Unset the suggested table and round-robin it later
          playersWithTableAssignments[i].suggestedTableIdentifier = null;
          continue;
        }
        tableWithPlayers[tableIndex].players.push(
          playersWithTableAssignments[i]
        );
      }

      const unseatedPlayers = tabledPlayers.filter(
        (p) => !p.suggestedTableIdentifier
      );

      maxPlayersPerTable = 8;
      const spotsRemaining = tableWithPlayers.reduce(
        (sum, table) => sum + (maxPlayersPerTable - table.players.length),
        0
      );
      requiredTables =
        requiredPreassignedTables +
        (unseatedPlayers.length > spotsRemaining
          ? Math.ceil(
            (unseatedPlayers.length - spotsRemaining) / maxPlayersPerTable
          )
          : 0);
    }

    let shuffledPlayers: IServerTournamentPlayer[] = shuffle(
      tabledPlayers.filter((p) => !p.suggestedTableIdentifier)
    );

    for (let i = 0; i < requiredTables; ++i) {
      if (!tableWithPlayers[i]) tableWithPlayers[i] = { players: [], name: "" };
    }

    // Walk through all unallocated players and give to the smaller tables first
    while (shuffledPlayers.length) {
      tableWithPlayers = tableWithPlayers.sort(
        (t1, t2) => t1.players.length - t2.players.length
      );
      const player = shuffledPlayers[0];
      shuffledPlayers = shuffledPlayers.slice(1);
      tableWithPlayers[0].players.push(player);
    }

    const updates: { [key: string]: number | string } = {};
    const tables = [];
    for (let tableIndex = 0; tableIndex < requiredTables; tableIndex++) {
      const tablePlayers = tableWithPlayers[tableIndex].players.map(
        (p, idx) => ({
          ...p,
          position: idx,
        })
      );
      const name =
        tableWithPlayers[tableIndex].name ||
        `Tournament Table #${tableIndex + 1}`;
      const table = await createTable({
        name,
        players: tablePlayers,
        buyIn: tournamentData.buyIn,
        organizerId: tournamentData.organizerId,
        tournamentData,
      });
      tables.push({ table, name, stage: GameStage.Active });
      for (let i = 0; i < tablePlayers.length; ++i) {
        updates[`players.${tablePlayers[i].id}.tableId`] = table.id;
      }
    }

    if (tournamentData.enableOverflowRooms) {
      const extraRoomCount = tournamentData.allowGuestsInOverflowRooms
        ? Math.ceil(tables.length / 2.0)
        : Math.ceil(tables.length / 4.0);
      for (let tableIndex = 0; tableIndex < extraRoomCount; tableIndex++) {
        const name = `Observation Table #${tableIndex + 1}`;
        const table = await createTable({
          name,
          players: [],
          buyIn: tournamentData.buyIn,
          organizerId: tournamentData.organizerId,
          tournamentData,
          stage: GameStage.Ended,
        });
        tables.push({ table, name, stage: GameStage.Ended });
      }
    }

    await tournamentDoc.update({
      status: TournamentStatus.Active,
      tableIdentifiers: tables.reduce(
        (map, t) => ({
          ...map,
          [t.table.id]: {
            id: t.table.id,
            stage: t.stage || GameStage.Active,
            activeHandId: null,
            name: t.name,
          },
        }),
        {}
      ),
      ...updates,
    });

    const startPauseMessage = pauseMessage || tournamentData.startPauseMessage;
    if (startPauseMessage) {
      await pauseOrResumeTournament(tournamentId, true, startPauseMessage);
    }

    return response.json({
      started: true,
      warning: warningError,
    });
  });
}

/**
 * @swagger
 *
 * /tournament/rebuy:
 *   post:
 *     tags: [Tournaments]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: tournamentId
 *         in: body
 *         required: true
 *         type: string
 *       - name: playerId
 *         in: body
 *         required: true
 *         type: string
 *       - name: confirm
 *         in: body
 *         required: true
 *         type: string
 *       - name: type
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *         400:
 *           description: Resource not found
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   error: 
 *                    type: string
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
 *           description: An object with boolean value after rebuying the tournament
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   rebuy: 
 *                    type: boolean
 */
async function rebuy(
  request: AuthenticatedRequest,
  response: express.Response,
  {
    getTournament,
  }: { db: FirebaseFirestore.Firestore; getTournament: GetTournamentFunction }
) {
  const { tournamentId, playerId, confirm, type } = JSON.parse(request.body);

  await lockTournamentAndRun(tournamentId, null, async () => {
    const { tournament: tournamentDoc, tables: tableDocs } =
      await getTournament(tournamentId, {
        includeTables: true,
        currentUserId: playerId,
      });
    if (!tournamentDoc) {
      return response.status(403).json({ error: "Unauthorized" });
    }

    const tournamentData = tournamentDoc.data();
    const userId = playerId || request.user.uid;
    const tableId = tournamentData.players[userId]
      ? tournamentData.players[userId].tableId
      : null;

    if (!tableId) {
      return response.status(403).json({ error: "Table not found" });
    }

    const tableDoc = tableDocs.docs.find((t) => t.id === tableId);
    const tableData = tableDoc.data();

    if (!tournamentData.players[userId] || !tableData.players[userId]) {
      return response.status(403).json({ error: "Unauthorized" });
    }

    if (!canRebuyInTournament(tournamentData, tournamentData.players[userId])) {
      console.error("Not allowed to rebuy", {
        uid: userId,
        stack: tournamentData.players[userId].stack,
        active: tournamentData.players[userId].active,
        confirm,
      });
      return response
        .status(400)
        .json(
          confirm
            ? { error: "Not allowed to rebuy" }
            : { error: "Not allowed to decline rebuy" }
        );
    }

    let updates: { [key: string]: number | string | boolean | IRebuy[] } = {};
    if (confirm) {
      const rebuys = tournamentData.players[userId].rebuys || [];
      const { buyIn, rebuyOptions, round } =
        getBuyInAmountInTournament(tournamentData);
      const selectedOption = rebuyOptions[type as keyof IRebuyOptions];
      updates = {
        [`players.${userId}.active`]: true,
        [`players.${userId}.stack`]: Math.ceil(selectedOption.stack),
        [`players.${userId}.rebuys`]: [
          ...rebuys,
          {
            amount: selectedOption.value,
            type: type,
            stack: selectedOption.stack,
            timestamp: new Date().getTime(),
            round: round,
          },
        ],
        [`players.${userId}.contributed`]:
          tableData.players[userId].contributed + buyIn,
        [`players.${userId}.bustedTimestamp`]: null,
      };
    } else {
      updates = {
        [`players.${userId}.rebuyDeclined`]: true,
        [`players.${userId}.willRemove`]: true,
      };
    }
    // Lock the table and fix up the player
    const tableLockName = `tournament.${tournamentId}.table.${tableId}`;
    await acquireLockAndExecute(
      tableLockName,
      async () => {
        await tableDoc.ref.update(updates);
      },
      "rebuy"
    );
    await tournamentDoc.ref.update(updates);

    return response.json({
      rebuy: true,
    });
  });
}

/**
 * @swagger
 *
 * /tournament/topup:
 *   post:
 *     tags: [Tournaments]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: tournamentId
 *         in: body
 *         required: true
 *         type: string
 *       - name: playerId
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *         400:
 *           description: Resource not found
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   error: 
 *                    type: string
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
 *           description: An object with boolean value after topup of tournament
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   rebuy: 
 *                    type: boolean
 */
async function topup(
  request: AuthenticatedRequest,
  response: express.Response,
  {
    getTournament,
  }: { db: FirebaseFirestore.Firestore; getTournament: GetTournamentFunction }
) {
  const { tournamentId, playerId } = JSON.parse(request.body);

  await lockTournamentAndRun(tournamentId, null, async () => {
    const { tournament: tournamentDoc, tables: tableDocs } =
      await getTournament(tournamentId, {
        includeTables: true,
        currentUserId: playerId,
      });
    if (!tournamentDoc) {
      return response.status(403).json({ error: "Unauthorized" });
    }

    const tournamentData = tournamentDoc.data();
    const userId = playerId || request.user.uid;
    const tableId = tournamentData.players[userId]
      ? tournamentData.players[userId].tableId
      : null;
    const tableDoc = tableDocs.docs.find((t) => t.id === tableId);
    const tableData = tableDoc.data();

    if (!tournamentData.players[userId] || !tableData.players[userId]) {
      return response.status(403).json({ error: "Unauthorized" });
    }

    if (!canTopUpInTournament(tournamentData, tournamentData.players[userId])) {
      console.error("Not allowed to top-up", {
        uid: userId,
        stack: tournamentData.players[userId].stack,
        active: tournamentData.players[userId].active,
      });
      return response.status(400).json({ error: "Not allowed to rebuy" });
    }

    const rebuys = tournamentData.players[userId].rebuys || [];
    const { buyIn, stack } = getBuyInAmountInTournament(tournamentData);
    const topupRatio = tournamentData.topUpAmount / stack;
    const amount = topupRatio * buyIn;
    const updates: { [key: string]: number | string | any } = {
      [`players.${userId}.active`]: true,
      [`players.${userId}.stack`]:
        tournamentData.players[userId].stack + tournamentData.topUpAmount,
      [`players.${userId}.rebuys`]: [
        ...rebuys,
        { amount: amount, timestamp: new Date().getTime(), isTopUp: true },
      ],
      [`players.${userId}.contributed`]:
        tableData.players[userId].contributed + amount,
      [`players.${userId}.bustedTimestamp`]: null,
    };
    // Lock the table and fix up the player
    const tableLockName = `tournament.${tournamentId}.table.${tableId}`;
    await acquireLockAndExecute(
      tableLockName,
      async () => {
        await tableDoc.update(updates);
      },
      "topup"
    );
    await tournamentDoc.update(updates);

    return response.json({
      rebuy: true,
    });
  });
}

/**
 * @swagger
 *
 * /tournament/export:
 *   get:
 *     tags: [Tournaments]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: tournamentId
 *         in: body
 *         type: string
 *     responses:
 *         200:
 *           description: An array of tables in a tournament
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:  
 *                   tables:
 *                     type: array
 *                     items: 
 *                       $ref: '#/components/schemas/Table'                                                                
 */
async function exportTournament(
  request: AuthenticatedRequest,
  response: express.Response,
  {
    getTournament,
  }: { db: FirebaseFirestore.Firestore; getTournament: GetTournamentFunction }
) {
  const { tournamentId } = JSON.parse(request.body);

  const { tables: tableDocs } = await getTournament(
    tournamentId || "1Bid9OMS4q9cYwpOhndQ",
    {
      includeTables: true,
    }
  );

  const tables = [];
  for (const table of tableDocs.docs) {
    const tableData = table.data();
    const hands = await table.ref.collection<IHand>("hands").get();
    tableData.hands = [];
    for (const hand of hands.docs) {
      const handData = hand.data();
      handData.players = [];
      const players = await hand.ref.collection<IPlayerState>("players").get();
      for (const player of players.docs) {
        handData.players.push(player.data());
      }
      tableData.hands.push(handData);
    }
    tables.push(tableData);
  }

  return response.json({
    tables,
  });
}

/**
 * @swagger
 *
 * /tournament/snapshot:
 *   post:
 *     tags: [Tournaments]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: tournamentId
 *         in: body
 *         required: true
 *         type: string
 *       - name: reason
 *         in: body
 *         type: string
 *     responses:
 *         200:
 *           description: An object with observe boolean indicating successful snapshot of a tournament
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   snapshot: 
 *                    type: boolean
 */
async function snapshotTournament(
  request: AuthenticatedRequest,
  response: express.Response,
  {
    getTournament,
  }: { db: FirebaseFirestore.Firestore; getTournament: GetTournamentFunction }
) {
  const { tournamentId, reason = "" } = JSON.parse(request.body);

  await handleSnapshotTournament(tournamentId, reason, getTournament);

  return response.json({
    snapshot: true,
  });
}

/**
 * @swagger
 *
 * /tournament/end:
 *   post:
 *     tags: [Tournaments]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: tournamentId
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *         200:
 *           description: An object with boolean value after ending the tournament
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   ended: 
 *                    type: boolean
 */
async function end(
  request: AuthenticatedRequest,
  response: express.Response,
  {
    getTournament,
  }: { db: FirebaseFirestore.Firestore; getTournament: GetTournamentFunction }
) {
  const { tournamentId } = JSON.parse(request.body);

  await lockTournamentAndRun(tournamentId, null, async () => {
    const { tournament: tournamentDoc, tables } = await getTournament(
      tournamentId,
      { includeTables: true }
    );
    if (!tournamentDoc) {
      return response.status(403).json({ error: "Unauthorized" });
    }

    const updatedStatus =
      tournamentDoc.data().status === TournamentStatus.Ended
        ? TournamentStatus.Finalized
        : TournamentStatus.Ended;

    await tournamentDoc.update({
      status: updatedStatus,
      ...(updatedStatus === TournamentStatus.Ended && {
        finalizeTime: getTournamentFinalizeTime(),
      }),
    });

    if (updatedStatus === TournamentStatus.Ended) {
      for (const table of tables.docs) {
        const tableLockName = `tournament.${tournamentId}.table.${table.id}`;
        await acquireLockAndExecute(
          tableLockName,
          async () => {
            await table.update({ activeHandId: null, stage: GameStage.Ended });
          },
          "rebalance"
        );
      }
    }

    if (updatedStatus === TournamentStatus.Finalized) {
      for (const table of tables.docs) {
        const { smartMediasoupHost } = table.data();

        if (smartMediasoupHost) {
          await removeMediaServerHostTable({ host: smartMediasoupHost, tableId: table.id })
        }
      }
    }

    return response.json({
      ended: true,
    });
  });
}

/**
 * @swagger
 *
 * /tournament/observetable:
 *   post:
 *     tags: [Tournaments]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: tournamentId
 *         in: body
 *         required: true
 *         type: string
 *       - name: tableId
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *         200:
 *           description: An object with observe boolean indicating successful assignment of players of table to a tournament
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   observe: 
 *                    type: boolean
 */
async function observeTable(
  request: AuthenticatedRequest,
  response: express.Response,
  {
    getTournament,
  }: { db: FirebaseFirestore.Firestore; getTournament: GetTournamentFunction }
) {
  const { tournamentId, tableId } = JSON.parse(request.body);

  await lockTournamentAndRun(tournamentId, null, async () => {
    const { tournament: tournamentDoc } = await getTournament(tournamentId);
    if (!tournamentDoc) {
      return response.status(403).json({ error: "Unauthorized" });
    }

    if (tournamentDoc.data().players[request.user.uid]?.stack) {
      return response
        .status(200)
        .json({ error: "Don't set for active player" });
    }

    const playersAtTable = Object.values(tournamentDoc.data().players).filter(
      (p) => p.role === PlayerRole.Observer && p.tableId === tableId
    ).length;

    // Allow up to 8 observers
    if (playersAtTable >= 8) {
      return response.status(403).json({ error: "Observer limit reached" });
    }

    await tournamentDoc.update({
      [`players.${request.user.uid}.tableId`]: String(tableId),
    });

    return response.json({
      observe: true,
    });
  });
}

/**
 * @swagger
 *
 * /tournament/pause:
 *   post:
 *     tags: [Tournaments]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: tournamentId
 *         in: body
 *         required: true
 *         type: string
 *       - name: message
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *         200:
 *           description: An object with boolean value after pausing the tournament
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   paused: 
 *                    type: boolean
 */
async function pause(
  request: AuthenticatedRequest,
  response: express.Response,
  {
    getTournament,
  }: { db: FirebaseFirestore.Firestore; getTournament: GetTournamentFunction }
) {
  const { tournamentId, message } = JSON.parse(request.body);

  await pauseOrResumeTournament(tournamentId, true, message);

  return response.json({
    paused: true,
  });
}

/**
 * @swagger
 *
 * /tournament/resume:
 *   post:
 *     tags: [Tournaments]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: tournamentId
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *         200:
 *           description: An object with boolean value after resuming the tournament
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   paused: 
 *                    type: boolean
 */
async function resume(
  request: AuthenticatedRequest,
  response: express.Response,
  {
    getTournament,
  }: { db: FirebaseFirestore.Firestore; getTournament: GetTournamentFunction }
) {
  const { tournamentId } = JSON.parse(request.body);

  await pauseOrResumeTournament(tournamentId, false, "");

  return response.json({
    paused: false,
  });
}

/**
 * @swagger
 *
 * /tournament/token:
 *   post:
 *     tags: [Tournaments]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: tournamentId
 *         in: body
 *         required: true
 *         type: string
 *       - name: roomId
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *         500:
 *           description: Internal Server Error
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   error: 
 *                    type: string
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
 *           description: An object with token for tournament
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   token: 
 *                    type: string
 */
async function token(
  request: AuthenticatedRequest,
  response: express.Response,
  {
    getTournament,
  }: { db: FirebaseFirestore.Firestore; getTournament: GetTournamentFunction }
) {
  const { tournamentId, roomId } = JSON.parse(request.body);

  const tournamentDoc = await getTournament(tournamentId, {
    includeTables: true,
    allowPartialTables: true,
    activeTableId: roomId,
  }); //, request.user.uid);

  if (!tournamentDoc) {
    return response.status(403).json({ error: "Unauthorized" });
  }
  const config = await loadConfig();
  const mediaSoupHostNames = (config.app.mediasoup_hostnames || "").split(",");
  // const tournamentData = tournamentDoc.tournament.data();

  // Deal with payment through stripe links
  // if (!isPaid(tableData, request.user.uid)) {
  //   return response.status(403).json({ error: "Payment not received" });
  // }

  try {
    // const isAlreadyJoined = isPlayerTabledInTournament(
    //   tournamentData,
    //   tournamentData.players[request.user.uid]
    // );

    // if (!isAlreadyJoined && tournamentData.organizerId !== request.user.uid) {
    //   return response.status(403).json({ error: "Unauthorized" });
    // }

    const signedToken = new AccessToken(
      "ACCOUNT_SID",
      "API_KEY_SID",
      "API_KEY_SECRET",
      {
        ttl: MAX_ALLOWED_SESSION_DURATION,
      }
    );

    const room = `${tournamentId}-${roomId}`;
    const hash = Math.abs(hashCode(room));
    let mediasoupHost = mediaSoupHostNames[hash % mediaSoupHostNames.length];

    // Before we were taking the first doc (mistakenly thinking only 1 was returned)
    // Filter the specific table out so we don't connect to the wrong table
    if (tournamentDoc.tables.docs.length) {
      const activeTable = tournamentDoc.tables.docs.find(
        (t) => t.id === roomId
      );
      if (activeTable && activeTable.data().mediasoupHost) {
        mediasoupHost = activeTable.data().mediasoupHost;
      }
    }

    // @ts-ignore
    signedToken.identity = JSON.stringify({
      id: request.user.uid,
      name: request.user.name || request.user.uid,
      hostedMedia: "mediasoup",
      mediaServerRoot: mediasoupHost,
    });
    const videoGrant = new VideoGrant({ room });
    signedToken.addGrant(videoGrant);

    return response.json({
      token: signedToken.toJwt(),
    });
  } catch (e) {
    logger.exception(e);
    return response.status(500).json({ error: (e as any).message });
  }
}

/**
 * @swagger
 *
 * /tournament/organizer/invite:
 *   post:
 *     tags: [Tournaments]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: tournamentId
 *         in: body
 *         required: true
 *         type: string
 *       - name: email
 *         in: body
 *         required: true
 *         type: string
 *       - name: name
 *         in: body
 *         required: true
 *         type: string
 *       - name: role
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *         200:
 *           description: An object with observe boolean indicating invitation sent successfully to join a tournament
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   enrolled: 
 *                    type: boolean
 *                   code:
 *                    type: string
 */
async function organizerInvite(
  request: AuthenticatedRequest,
  response: express.Response,
  {
    getTournament,
  }: { db: FirebaseFirestore.Firestore; getTournament: GetTournamentFunction }
) {
  const { tournamentId, email, name, role } = JSON.parse(request.body);

  await lockTournamentAndRun(tournamentId, null, async () => {
    const { tournament: tournamentDoc } = await getTournament(tournamentId, {
      includeTables: false,
    });
    if (!tournamentDoc) {
      return response.status(403).json({ error: "Unauthorized" });
    }

    const playerRole = role || role === PlayerRole.Organizer;
    const backupName =
      role === PlayerRole.Featured ? "-featured-" : "-organizer-";

    const secret = tinyUid(25);
    const updates: any = {
      [`players.${secret}`]: {
        active: false,
        id: secret,
        name: name || backupName,
        email,
        photoURL: "",
        role: playerRole,
        removed: true,
      },
    };

    await tournamentDoc.update(updates);
    return response.json({ enrolled: true, code: secret });
  });
}

/**
 * @swagger
 *
 * /tournament/organizer/accept:
 *   post:
 *     tags: [Tournaments]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: tournamentId
 *         in: body
 *         required: true
 *         type: string
 *       - name: code
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *         200:
 *           description: An object with boolean value indicating invitation to join the tournament accepted
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   accepted: 
 *                    type: boolean
 */
async function organizerAccept(
  request: AuthenticatedRequest,
  response: express.Response,
  {
    getTournament,
  }: { db: FirebaseFirestore.Firestore; getTournament: GetTournamentFunction }
) {
  const { tournamentId, code } = JSON.parse(request.body);

  await lockTournamentAndRun(tournamentId, null, async () => {
    const { tournament: tournamentDoc } = await getTournament(tournamentId, {
      includeTables: false,
    });
    if (!tournamentDoc) {
      return response.status(403).json({ error: "Unauthorized" });
    }
    const tournamentData = tournamentDoc.data();

    const matchingPlayer = tournamentData.players[code];
    if (!matchingPlayer) {
      return response.status(403).json({ error: "Unauthorized" });
    }
    const updates: any = {
      [`players.${code}`]: admin.firestore.FieldValue.delete(),
      [`players.${request.user.uid}`]: {
        active: false,
        id: request.user.uid,
        name: request.user.name || `${request.user.uid}`,
        email: request.user.email || "",
        photoURL: request.user.picture || "",
        created: new Date().getTime(),
        role: matchingPlayer.role,
        removed: true,
        _root: { code },
      },
      organizerIds: [...tournamentData.organizerIds, request.user.uid],
    };

    await tournamentDoc.update(updates);

    return response.json({ accepted: true });
  });
}

// Force rebalance
/**
 * @swagger
 *
 * /tournament/rebalance:
 *   post:
 *     tags: [Tournaments]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: tournamentId
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *         200:
 *           description: An object with boolean value indicating successful rebalancing of tournament
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   enrolled: 
 *                    type: boolean
 *         403:
 *           description: Something went wrong
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   error: 
 *                    type: string
 */
async function rebalance(
  request: AuthenticatedRequest,
  response: express.Response,
  {
    getTournament,
  }: { db: FirebaseFirestore.Firestore; getTournament: GetTournamentFunction }
) {
  const { tournamentId } = JSON.parse(request.body);

  await lockTournamentAndRun(tournamentId, null, async () => {
    const { tournament: tournamentDoc } = await getTournament(tournamentId, {
      includeTables: false,
    });
    if (!tournamentDoc) {
      return response.status(403).json({ error: "Unauthorized" });
    }
    const tournamentData = tournamentDoc.data();
    if (tournamentData.status !== TournamentStatus.Initialized) {
      return response.status(403).json({ error: "Unauthorized" });
    }

    const registrationsWithCode = (
      await typedDb
        .collection<ITournamentDetails>("tournaments")
        .doc(tournamentId)
        .collection<ITournamentRegistration>("registrants")
        .where("enrolled", "==", false)
        .get()
    ).docs;

    const updates: any = {};
    const position = -1;

    const buyIn = tournamentData.buyIn;
    const stack = tournamentData.startingStack;
    for (const reg of registrationsWithCode.filter((r) => !r.data().enrolled)) {
      const rData = reg.data();
      const existingPlayer = tournamentData.players[`players.${rData.secret}`];
      updates[`players.${rData.secret}`] = {
        active: true,
        stack,
        contributed: buyIn,
        position,
        id: rData.secret,
        name: rData.name,
        email: rData.email,
        photoURL: "",
        role: existingPlayer ? existingPlayer.role : PlayerRole.Player,
        removed: false,
      };
      await reg.update({ enrolled: true });
    }

    await tournamentDoc.update(updates);
    return response.json({ enrolled: true });
  });
}

/**
 * @swagger
 *
 * /tournament/cache:
 *   delete:
 *     tags: [Tournaments]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: tournamentId
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *         200:
 *           description: An object with boolean value to indicate cleaned cache of tournament
 *           content:
 *              application/json:
 *                 schema:
 *                    type: object 
 *                    properties:
 *                      purged: 
 *                        type: boolean   
 */
async function purgeCache(
  request: AuthenticatedRequest,
  response: express.Response,
  {
    getTournament,
  }: { db: FirebaseFirestore.Firestore; getTournament: GetTournamentFunction }
) {
  const { tournamentId } = JSON.parse(request.body);

  await lockTournamentAndRun(tournamentId, null, async () => {
    cache.flush();
    return response.json({
      purged: false,
    });
  });
}

/**
 * @swagger
 *
 * /tournament/results:
 *   get:
 *     tags: [Tournaments]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: tournamentId
 *         in: query
 *         required: true
 *         type: string
 *     responses:
 *         200:
 *           description: An array of result for each player in a tournament
 *           schema:
 *             type: array 
 *             items: 
 *                type: array
 *                items: string             
 */
async function exportResults(
  request: AuthenticatedRequest,
  response: express.Response,
  {
    getTournament,
  }: { db: FirebaseFirestore.Firestore; getTournament: GetTournamentFunction }
) {
  const { tournamentId } = request.query;

  const { tournament } = await getTournament(tournamentId as string, {
    includeTables: false,
  });

  const tournamentData = tournament.data();
  const lines = [
    ["name", "contribution", "stack", "rebuys", "eliminated"].join(","),
  ];
  Object.values(tournamentData.players)
    .filter((p) => p.contributed > 0)
    .forEach((p) => {
      lines.push(
        [
          p.name,
          String(p.contributed),
          String(p.stack),
          (p.rebuys || [])
            .map((el) => el.amount)
            .reduce((sum, value) => sum + value, 0)
            .toString(),
          p.bustedTimestamp ? new Date(p.bustedTimestamp).toISOString() : "-",
        ]
          .map((s) => s.replace(/,/g, ""))
          .join(",")
      );
    });

  lines.push("");
  lines.push("");
  lines.push(["name", "rebuy round", "rebuy level", "dollar amount"].join(","));

  Object.values(tournamentData.players)
    .filter((p) => p.contributed > 0)
    .forEach((p) => {
      if (p.rebuys && p.rebuys.length > 0) {
        Object.values(p.rebuys).forEach((r) => {
          lines.push(
            [
              p.name,
              String(r.round + 1),
              String(r.stack * tournamentData.startingStack),
              String(r.amount),
            ]
              .map((s) => s.replace(/,/g, ""))
              .join(",")
          );
        });
      }
    });

  response.setHeader("Content-Type", "text/csv");
  response.setHeader(
    "Content-Disposition",
    `attachment; filename=\"tournament-results-${tournamentId}-${Date.now()}.csv\"`
  );

  return response.send(lines.join("\n"));
}

module.exports = {
  away,
  start,
  create,
  edit,
  respond,
  register,
  leave,
  rebuy,
  topup,
  remove,
  end,
  pause,
  resume,
  enroll,
  token,
  flip,
  rebalance,
  profile,
  observeTable,
  organizerInvite,
  organizerAccept,
  respondAndAdvanceTournamentHand,
  exportTournament,
  exportResults,
  snapshotTournament,
  purgeCache,
  update,
};

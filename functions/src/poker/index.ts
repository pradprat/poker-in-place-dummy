import express from "express";
import {
  GameType,
  GameStage,
  TournamentStatus,
  ITournamentDetails,
  IGame,
  IGameSnapshot,
} from "../engine/types";
import { getTournament, IServerTournamentDetails } from "./tournaments/lib";
import { typedDb, cache, locks } from "./utils";
import { getCachedConfig } from "./config";

const fs = require("fs");
const path = require("path");
const gitTag = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../git-hash.json"))
);

const admin = require("firebase-admin");
const functions = require("firebase-functions");
const cors = require("cors");
const bodyParser = require("body-parser");
const tinyUid = require("../utils/tiny-uid").default;
import logger from "../utils/log";
import {
  getTable,
  AuthenticatedRequest,
  IServerGame,
  respondAndAdvanceHand,
} from "./lib";

const isEmulator = functions.config().app.is_emulator;

const namespace = require("../utils/namespace").default;
// const { validateFirebaseIdTokenWithAuth } = require("../utils/auth");
import { isGameExpired } from "../engine/index";

import { resetTournament } from "./tournaments/resetTournament";
import { joinTournament } from "./tournaments/joinTournament/index";

const db = admin.firestore();
const oldLog = console.log;
const oldWarn = console.warn;
const oldError = console.error;
const oldDebug = console.debug;

const getId = () => {
  return namespace.get("id") || "root";
};

const getLogMethod = (type: string) => {
  let logMethod: any = oldLog;
  switch (type) {
    case "warn":
      logMethod = oldWarn;
      break;
    case "debug":
      logMethod = oldDebug;
      break;
  }
  return logMethod;
};

const logCache: { [key: string]: { timestamp: number; logs: any[] } } = {};
const deferredLog = (id: string, type: string, msg: string, args: any[]) => {
  const config = getCachedConfig();
  if (config?.app?.noisyLogging || isEmulator) {
    const logMethod = getLogMethod(type);
    logMethod(msg, ...args);
    return;
  }
  if (!logCache[id])
    logCache[id] = { timestamp: new Date().getTime(), logs: [] };
  logCache[id].logs.push([type, msg, args]);

  // Clear up old logs
  const removeKeys = Object.keys(logCache).filter(
    (k) => new Date().getTime() - logCache[k].timestamp > 1000 * 60
  );
  for (const key of removeKeys) {
    delete logCache[key];
  }
};

const logAndFlush = (func: any, msg: string, args: any) => {
  // Flush the old logs
  const id = getId();
  if (logCache[id]) {
    for (const [_type, _msg, _args] of logCache[id].logs) {
      const logMethod = getLogMethod(_type);
      logMethod(_msg, ..._args);
    }
    delete logCache[id];
  }
  func(msg, ...args);
};

console.log = (...args: any[]) =>
  deferredLog(getId(), "log", `${getId()}-${new Date().getTime()}`, args);
console.debug = (...args: any[]) =>
  deferredLog(getId(), "debug", `${getId()}-${new Date().getTime()}`, args);
console.warn = (...args: any[]) =>
  logAndFlush(oldWarn, `${getId()}-${new Date().getTime()}`, args);
console.error = (...args: any[]) =>
  logAndFlush(oldError, `${getId()}-${new Date().getTime()}`, args);
// console.log = (...args: any[]) =>
//   oldLog(`${getId()}-${new Date().getTime()}`, ...args);
// console.debug = (...args: any[]) =>
//   oldDebug(`${getId()}-${new Date().getTime()}`, ...args);
// console.warn = (...args: any[]) =>
//   oldWarn(`${getId()}-${new Date().getTime()}`, ...args);
// console.error = (...args: any[]) =>
//   oldError(`${getId()}-${new Date().getTime()}`, ...args);

const app = express();

app.use(bodyParser.text());

app.use(cors({ origin: true }));

/**
 * @swagger
 *  components:
 *    schemas:
 *     Health:
 *       type: object
 *       properties:
 *          version:
 *            type: number
 *          cache:
 *            type: object
 *            properties:
 *              size:
 *                type: number
 *              readTimestanps:
 *                type: object
 *          locks:
 *            type: object
 *          gitTag:
 *            type: object
 *            properties:
 *              dirty:
 *                type: boolean
 *              raw:
 *                type: string
 *              hash:
 *                type: string
 *              distance:
 *                type: string
 *              tag:
 *                type: string
 *              semver:
 *                type: string
 *              suffix:
 *                type: string
 *              semverString:
 *                type: string
 *              timestamp:
 *                type: string
 */

/**
 * @swagger
 *
 * tags:
 *   name: Healths
 *   description: Poker health management
 */
/**
 * @swagger
 *
 * tags:
 *   name: Webhooks
 *   description: Poker webhooks management
 */

/**
 * @swagger
 *   /health:
 *     get:
 *       tags: [Healths]
 *       produces:
 *         - application/json
 *       responses:
 *         200:
 *           description: An object showing health of api
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Health'
 */
app.get("/health", (req: express.Request, res: express.Response) => {
  res.json({
    version: 2,
    cache: {
      size: cache.keys().length,
      readTimestamps: cache.readTimes(),
    },
    locks: Object.keys(locks)
      .filter((key) => locks[key].held)
      .reduce(
        (map, key) => ({ ...map, [key]: { ...locks[key], lock: null } }),
        {}
      ),
    gitTag,
  });
});

/**
 * @swagger
 *   /webhooks/video_copied:
 *     post:
 *       tags: [Webhooks]
 *       requestBody:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties: 
 *                 data:
 *                   type: object
 *                   properties:
 *                      url:
 *                        type: string
 *         responses:
 *            200:
 *              description: Video updated successfully
 *            404:
 *              description: Bad request
 *         
 */
app.post("/webhooks/video_copied", bodyParser.json(), async (req: express.Request, res: express.Response): Promise<Express.Response> => {
  if (!req.body?.data?.url) {
    res.sendStatus(404);
  }

  const { url } = req.body.data;

  const tournaments = await db
    .collection("tournaments")
    .where('branding.welcomeVideoUrl', "==", url)
    .limit(1)
    .get();

  for (const tournament of tournaments.docs) {
    const tournamentData = tournament.data();
    const docRef = db.collection("tournaments").doc(tournament.id);
    await docRef.update({
      branding: {
        ...tournamentData.branding,
        isWelcomeVideoLoaded: true
      },
    });
  }

  return res.sendStatus(200);
})

// app.use(validateFirebaseIdTokenWithAuth(admin.auth(), db));

const callAndLog = async (
  method: Function,
  req: AuthenticatedRequest,
  res: express.Response
) => {
  let error = "";
  let startTime = new Date().getTime();
  const id = tinyUid(5);
  const uid = req.user ? req.user.uid : null;
  try {
    const result = await new Promise((resolve, reject) => {
      namespace.run(() => {
        namespace.set("request", req);
        namespace.set("id", id);
        namespace.set("context_user", {
          id: req.user ? req.user.uid : undefined,
          username: req.user ? req.user.name : undefined,
          email: req.user ? req.user.email : undefined,
          ip_address: req.ip,
        });
        namespace.set("context_tags", {
          method: method.name,
          id,
        });
        namespace.set("context_extra", {
          query: req.query,
          body: req.body,
        });
        console.log(`Running ${method.name} from ${uid}`);
        method(req, res, { db, getTable, getTournament })
          .then(resolve)
          .catch((e: Error) => {
            console.log("exception");
            logger.exception(e);
            reject(e);
          });
        const duration = new Date().getTime() - startTime;
        console.log(
          `Ran ${method.name} from ${uid} (${duration}ms - ${res.statusCode})`
        );
      });
    });
    return result;
  } catch (e) {
    logger.exception((e as any), {
      extra: {
        method: method.name,
        user: req.user ? req.user.uid : null,
        query: req.query,
        body: req.body,
        id,
      },
    });
    error = e.toString();
    return res.status(500).send(error);
  } finally {
    try {
      let info = req.query;
      const duration = new Date().getTime() - startTime;
      if (req.body) {
        try {
          info = JSON.parse(req.body);
        } catch (e) {
          //
        }
      }
      if (info.tournamentId) {
        await typedDb
          .collection<ITournamentDetails>("tournaments")
          .doc(String(info.tournamentId))
          .collection("events")
          .doc(`${new Date().getTime()}-${uid}-${method.name}`)
          .set({
            uid: uid,
            method: method.name,
            params: info,
            duration,
            statusCode: res.statusCode,
            statusMessage: res.statusMessage,
            error,
          });
      }
      if (info.tableId) {
        await typedDb
          .collection<IGame>("tables")
          .doc(String(info.tableId))
          .collection("events")
          .doc(`${new Date().getTime()}-${uid}-${method.name}`)
          .set({
            uid,
            method: method.name,
            params: info,
            statusCode: res.statusCode,
            statusMessage: res.statusMessage,
            duration,
            error,
          });
      }
    } catch (e) {
      console.warn(id, e);
    }
  }
};

const { create } = require("./create");
app.post("/create", (req: express.Request, res: express.Response) =>
  callAndLog(create, req as AuthenticatedRequest, res)
);

const {
  create: createTournament,
  edit: editTournament,
  respond: respondTournament,
  leave: leaveTournament,
  start: startTournament,
  remove: removeTournament,
  rebuy: rebuyTournament,
  topup: topupTournament,
  register: registerTournament,
  enroll: enrollTournament,
  away: awayTournament,
  pause: pauseTournament,
  resume: resumeTournament,
  end: endTournament,
  flip: flipTournament,
  token: tokenTournament,
  observeTable: observeTableTournament,
  organizerInvite: organizerInviteTournament,
  organizerAccept: organizerAcceptTournament,
  rebalance: rebalanceTournament,
  profile: profileTournament,
  respondAndAdvanceTournamentHand,
  exportTournament,
  exportResults: exportTournamentResults,
  purgeCache,
  snapshotTournament,
  update: updateTournament,
} = require("./tournaments");
app.get("/tournament/export", (req: express.Request, res: express.Response) =>
  callAndLog(exportTournament, req as AuthenticatedRequest, res)
);
app.get("/tournament/results", (req: express.Request, res: express.Response) =>
  callAndLog(exportTournamentResults, req as AuthenticatedRequest, res)
);
app.delete("/tournament/cache", (req: express.Request, res: express.Response) =>
  callAndLog(purgeCache, req as AuthenticatedRequest, res)
);
app.post("/tournament/reset", (req: express.Request, res: express.Response) =>
  callAndLog(resetTournament, req as AuthenticatedRequest, res)
);
app.post(
  "/tournament/observetable",
  (req: express.Request, res: express.Response) =>
    callAndLog(observeTableTournament, req as AuthenticatedRequest, res)
);
app.post(
  "/tournament/snapshot",
  (req: express.Request, res: express.Response) =>
    callAndLog(snapshotTournament, req as AuthenticatedRequest, res)
);
app.post(
  "/tournament/organizer/invite",
  (req: express.Request, res: express.Response) =>
    callAndLog(organizerInviteTournament, req as AuthenticatedRequest, res)
);
app.post(
  "/tournament/organizer/accept",
  (req: express.Request, res: express.Response) =>
    callAndLog(organizerAcceptTournament, req as AuthenticatedRequest, res)
);
app.post("/tournament/enroll", (req: express.Request, res: express.Response) =>
  callAndLog(enrollTournament, req as AuthenticatedRequest, res)
);
app.post(
  "/tournament/register",
  (req: express.Request, res: express.Response) =>
    callAndLog(registerTournament, req as AuthenticatedRequest, res)
);
app.post("/tournament/create", (req: express.Request, res: express.Response) =>
  callAndLog(createTournament, req as AuthenticatedRequest, res)
);
app.post("/tournament/edit", (req: express.Request, res: express.Response) =>
  callAndLog(editTournament, req as AuthenticatedRequest, res)
);
app.post("/tournament/respond", (req: express.Request, res: express.Response) =>
  callAndLog(respondTournament, req as AuthenticatedRequest, res)
);
app.post("/tournament/join", (req: express.Request, res: express.Response) =>
  callAndLog(joinTournament, req as AuthenticatedRequest, res)
);
app.post("/tournament/leave", (req: express.Request, res: express.Response) =>
  callAndLog(leaveTournament, req as AuthenticatedRequest, res)
);
app.post("/tournament/away", (req: express.Request, res: express.Response) =>
  callAndLog(awayTournament, req as AuthenticatedRequest, res)
);
app.post("/tournament/start", (req: express.Request, res: express.Response) =>
  callAndLog(startTournament, req as AuthenticatedRequest, res)
);
app.post("/tournament/remove", (req: express.Request, res: express.Response) =>
  callAndLog(removeTournament, req as AuthenticatedRequest, res)
);
app.post("/tournament/flip", (req: express.Request, res: express.Response) =>
  callAndLog(flipTournament, req as AuthenticatedRequest, res)
);
app.post("/tournament/rebuy", (req: express.Request, res: express.Response) =>
  callAndLog(rebuyTournament, req as AuthenticatedRequest, res)
);
app.post("/tournament/topup", (req: express.Request, res: express.Response) =>
  callAndLog(topupTournament, req as AuthenticatedRequest, res)
);
app.post("/tournament/pause", (req: express.Request, res: express.Response) =>
  callAndLog(pauseTournament, req as AuthenticatedRequest, res)
);
app.post("/tournament/resume", (req: express.Request, res: express.Response) =>
  callAndLog(resumeTournament, req as AuthenticatedRequest, res)
);
app.post("/tournament/token", (req: express.Request, res: express.Response) =>
  callAndLog(tokenTournament, req as AuthenticatedRequest, res)
);
app.post("/tournament/end", (req: express.Request, res: express.Response) =>
  callAndLog(endTournament, req as AuthenticatedRequest, res)
);
app.post(
  "/tournament/rebalance",
  (req: express.Request, res: express.Response) =>
    callAndLog(rebalanceTournament, req as AuthenticatedRequest, res)
);
app.post("/tournament/profile", (req: express.Request, res: express.Response) =>
  callAndLog(profileTournament, req as AuthenticatedRequest, res)
);
app.put("/tournament/update", (req: express.Request, res: express.Response) =>
  callAndLog(updateTournament, req as AuthenticatedRequest, res)
);

const { join } = require("./join");
app.post("/join", (req: express.Request, res: express.Response) =>
  callAndLog(join, req as AuthenticatedRequest, res)
);

const { token } = require("./token");
app.post("/token", (req: express.Request, res: express.Response) =>
  callAndLog(token, req as AuthenticatedRequest, res)
);

const { start } = require("./start");
app.post("/start", (req: express.Request, res: express.Response) =>
  callAndLog(start, req as AuthenticatedRequest, res)
);

const { paid } = require("./paid");
app.post("/paid", (req: express.Request, res: express.Response) =>
  callAndLog(paid, req as AuthenticatedRequest, res)
);

const { pause, unpause } = require("./pause");
app.post("/pause", (req: express.Request, res: express.Response) =>
  callAndLog(pause, req as AuthenticatedRequest, res)
);
app.post("/unpause", (req: express.Request, res: express.Response) =>
  callAndLog(unpause, req as AuthenticatedRequest, res)
);

const { rebuy } = require("./rebuy");
app.post("/rebuy", (req: express.Request, res: express.Response) =>
  callAndLog(rebuy, req as AuthenticatedRequest, res)
);

const { extendCreate, extendConfirm } = require("./extend");
app.post("/extend/create", (req: express.Request, res: express.Response) =>
  callAndLog(extendCreate, req as AuthenticatedRequest, res)
);
app.post("/extend/confirm", (req: express.Request, res: express.Response) =>
  callAndLog(extendConfirm, req as AuthenticatedRequest, res)
);

const { reset } = require("./reset");
app.post("/reset", (req: express.Request, res: express.Response) =>
  callAndLog(reset, req as AuthenticatedRequest, res)
);

const { show } = require("./show");
app.post("/show", (req: express.Request, res: express.Response) =>
  callAndLog(show, req as AuthenticatedRequest, res)
);

const { respond } = require("./respond");
app.post("/respond", (req: express.Request, res: express.Response) =>
  callAndLog(respond, req as AuthenticatedRequest, res)
);

const { timeout } = require("./timeout");
app.post("/timeout", (req: express.Request, res: express.Response) =>
  callAndLog(timeout, req as AuthenticatedRequest, res)
);

const { updateBlinds } = require("./update");
app.post("/update/blinds", (req: express.Request, res: express.Response) =>
  callAndLog(updateBlinds, req as AuthenticatedRequest, res)
);

const { away } = require("./away");
app.post("/away", (req: express.Request, res: express.Response) =>
  callAndLog(away, req as AuthenticatedRequest, res)
);

const { leave } = require("./leave");
app.post("/leave", (req: express.Request, res: express.Response) =>
  callAndLog(leave, req as AuthenticatedRequest, res)
);

const { remove } = require("./remove");
app.post("/remove", (req: express.Request, res: express.Response) =>
  callAndLog(remove, req as AuthenticatedRequest, res)
);

const { end } = require("./end");
app.post("/end", (req: express.Request, res: express.Response) =>
  callAndLog(end, req as AuthenticatedRequest, res)
);

const { products, updateProduct, confirmProduct } = require("./products");
app.post("/products", (req: express.Request, res: express.Response) =>
  callAndLog(products, req as AuthenticatedRequest, res)
);
app.post("/products/update", (req: express.Request, res: express.Response) =>
  callAndLog(updateProduct, req as AuthenticatedRequest, res)
);
app.post("/products/confirm", (req: express.Request, res: express.Response) =>
  callAndLog(confirmProduct, req as AuthenticatedRequest, res)
);
// app.post("/extend/confirm", (req, res) => callAndLog(extendConfirm, req, res));

async function gameExpirationTimer(apiHostName: string) {
  console.log("Finding old tables");
  try {
    const activeTables = await typedDb
      .collection<IServerGame>("tables")
      .where(`stage`, "in", [
        GameStage.Active,
        GameStage.Paused,
        GameStage.Waiting,
      ])
      .get();

    for (const table of activeTables.docs) {
      const tableData = table.data();
      if (tableData.type !== GameType.Tournament) {
        if (isGameExpired(tableData)) {
          console.log(`Expiring game ${table.id}`);
          await table.update({ stage: GameStage.Ended });
        }
      }
    }

    console.log("Finding old tournaments");
    const activeTournaments = await typedDb
      .collection<ITournamentDetails>("tournaments")
      .where(`status`, "in", [
        TournamentStatus.Active,
        TournamentStatus.PauseRequested,
        TournamentStatus.Paused,
      ])
      .get();
    console.info(
      `gameExpirationTimer: Found ${activeTournaments.docs.length} expired tournaments`
    );

    for (const tournament of activeTournaments.docs) {
      const tournamentData = tournament.data();
      if (!tournamentData.startTime) {
        console.log(`Setting tournament start ${tournament.id}`);
        await tournament.update({ startTime: new Date().getTime() });
      } else if (
        tournamentData.startTime + 1000 * 60 * 60 * 12 <
        new Date().getTime()
      ) {
        console.log(`Expiring tournament ${tournament.id}`);
        await tournament.update({ status: TournamentStatus.Finalized });
      }
    }
  } catch (e) {
    logger.exception(e as any);
  }
}

const tournamentFinalizeTimer = async (): Promise<void> => {
  try {
    console.info("tournamentFinalizeTimer: Finding tournaments to finalize");
    const endedTournaments = await typedDb
      .collection<ITournamentDetails>("tournaments")
      .where(`status`, "in", [TournamentStatus.Ended])
      .limit(500)
      .get();

    console.info(
      `tournamentFinalizeTimer: Found ${endedTournaments.docs.length} ended tournaments`
    );

    const firebaseBatch = typedDb.batch();
    let counter = 0;
    for (const tournament of endedTournaments.docs) {
      const tournamentData = tournament.data();
      if (
        !tournamentData.finalizeTime ||
        (tournamentData.finalizeTime &&
          Math.max(0, tournamentData.finalizeTime - new Date().getTime()) === 0)
      ) {
        console.info(
          `tournamentFinalizeTimer: Finalizing tournament ${tournament.id}`
        );
        await firebaseBatch.update(tournament.ref, {
          status: TournamentStatus.Finalized,
        });
        counter++;
      }
    }
    if (counter) {
      await firebaseBatch.commit();
    }
    console.info(
      `tournamentFinalizeTimer: Committed ${counter} ended tournaments`
    );
  } catch (e) {
    logger.exception(e as any);
  }
};

const gameAdvancingTimer = async (apiHostName: string) => {
  try {
    console.info("Finding active tables");
    const activeTables = await typedDb
      .collection<IServerGame>("tables")
      .where(`stage`, "in", [GameStage.Active])
      .where(`type`, "==", GameType.Cash)
      .get();

    console.info(`Found ${activeTables.docs.length} active tables`);

    await Promise.all(
      activeTables.docs
        .filter((t) => t.data().apiServerHost === apiHostName)
        .map(async (table) => {
          try {
            console.info(`Auto advancing ${table.id}...`);
            await respondAndAdvanceHand(table.id, null, null);
          } catch (e) {
            logger.exception(e as any);
          }
        })
    );

    return activeTables;
  } catch (e) {
    logger.exception(e as any);
    return null;
  }
};

interface IServerTournamentDetails_dep extends IServerTournamentDetails {
  tableIds?: IGameSnapshot[];
}

const tournamentAdvancingTimer = async (apiHostName: string) => {
  try {
    console.info("Finding active tournaments");
    const activeTournaments = await typedDb
      .collection<IServerTournamentDetails_dep>("tournaments")
      .where(`status`, "in", [
        TournamentStatus.Active,
        TournamentStatus.Paused,
        TournamentStatus.PauseRequested,
      ])
      .get();

    console.info(`Found ${activeTournaments.docs.length} active tournaments`);
    const uniqueId = tinyUid(5);
    await Promise.all(
      activeTournaments.docs
        .filter(
          (t) =>
            t.data().managed === cache.isEnabled() &&
            t.data().apiServerHost === apiHostName
        )
        .map(async (tournament) => {
          try {
            if (
              tournament.data().tableIds &&
              !tournament.data().tableIdentifiers
            ) {
              await tournament.update({
                tableIdentifiers: tournament
                  .data()
                  .tableIds.reduce(
                    (map, obj) => ({ ...map, [obj.id]: obj }),
                    {}
                  ),
              });
            }
            console.info(
              `Auto advancing ${tournament.id} (managed: ${tournament.data().managed})...`
            );
            console.log(`lock - tournamentAdvancingTimer - ${tournament.id}`);
            const startResp = new Date().getTime();

            // Go table by table?
            // for (const tableId of tournament.data().tableIds) {
            //   await respondAndAdvanceTournamentHand(
            //     tournament.id,
            //     tableId.id,
            //     null,
            //     null,
            //     null,
            //     {
            //       reason: "tournamentAdvancingTimer",
            //       shouldNeedLock: true,
            //       uniqueId,
            //     },
            //     false,
            //     false,
            //     true
            //   );
            // }
            if (
              tournament.data().tableIdentifiers &&
              Object.values(tournament.data().tableIdentifiers)
            ) {
              await Promise.all(
                Object.values(tournament.data().tableIdentifiers).map(
                  async (tableId) => {
                    try {
                      await respondAndAdvanceTournamentHand(
                        tournament.id,
                        tableId.id,
                        null,
                        null,
                        null,
                        {
                          reason: "tournamentAdvancingTimer",
                          shouldNeedLock: true,
                          uniqueId,
                        },
                        false,
                        false,
                        true
                      );
                    } catch (e) {
                      if ((e as any).message !== "Requires tournament lock") {
                        console.debug(e);
                      }
                    }
                  }
                )
              );
            }
            console.log(`Pushing along tournament`);
            await respondAndAdvanceTournamentHand(
              tournament.id,
              null,
              null,
              null,
              null,
              {
                reason: "tournamentAdvancingTimer",
                shouldNeedLock: true,
                uniqueId,
              },
              false,
              false,
              true
            );
            console.log(
              "lock - tournamentAdvancingTimer",
              new Date().getTime() - startResp
            );
          } catch (e) {
            logger.exception(e as any);
          }
        })
    );

    return activeTournaments;
  } catch (e) {
    logger.exception(e as any);
    return null;
  }
};

export async function launchWatchers() {
  if (isEmulator) {
    async function run() {
      const runAdvanceLoop = async () => {
        console.log(`runAdvanceLoop`);
        await Promise.all([
          gameAdvancingTimer(null),
          tournamentAdvancingTimer(null),
        ]);
        setTimeout(runAdvanceLoop, 30 * 1000);
      };
      await runAdvanceLoop();
    }
    if (cache.isEnabled()) {
      await run();
    }
  }
}

const {
  getTournament: apiGetTournament,
  getTable: apiGetTable,
  resetTable: apiResetTable,
  createTable: apiCreateTable,
} = require("./api");

app.get("/api/table", (req: express.Request, res: express.Response) =>
  callAndLog(apiGetTable, req as AuthenticatedRequest, res)
);
app.post("/api/table", (req: express.Request, res: express.Response) =>
  callAndLog(apiCreateTable, req as AuthenticatedRequest, res)
);
app.delete("/api/table", (req: express.Request, res: express.Response) =>
  callAndLog(apiResetTable, req as AuthenticatedRequest, res)
);
app.get("/api/tournament", (req: express.Request, res: express.Response) =>
  callAndLog(apiGetTournament, req as AuthenticatedRequest, res)
);

module.exports.router = functions.https.onRequest(app);
module.exports.app = app;
module.exports.gameExpirationTimer = gameExpirationTimer;
module.exports.gameAdvancingTimer = gameAdvancingTimer;
module.exports.tournamentAdvancingTimer = tournamentAdvancingTimer;
module.exports.tournamentFinalizeTimer = tournamentFinalizeTimer;

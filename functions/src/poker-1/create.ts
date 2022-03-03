import express from "express";
import {
  IUserDetails,
  IGame,
  IGameFeatures,
  ICode,
  GameStage,
  GameType,
  PayType,
  GameMode,
  IJwtUser,
  BrandingType,
} from "../engine/types";
import { GetTableFunction, AuthenticatedRequest } from "./lib";
import { typedDb } from "./utils";
import { enableVideo } from "./token";
import { loadConfig } from "./config";

const { sendInvite } = require("./invite");
const { createCustomer, getStripeClient } = require("./stripe");
const { PlayerRole } = require("../engine/types");

interface IServerGame extends IGame {
  hostedMedia: string;
  mediasoupHost: string;
  paymentType?: string;
}

const {
  getMaximumParticipants,
  getModeCost,
  getMaximumDuration,
} = require("../engine/index");

export interface ICreateGameArgs {
  title: string;
  buyInAmount: number;
  bigBlindAmount: number;
  blindIncreaseDuration: number;
  // increment: number;
  emails: string;
  mode: GameMode;
  type: GameType;
  payType: PayType;
  code: string;
  startDate: string;
  timeZone: string;
  hostedMedia: string;
  features?: IGameFeatures;
  branding?: BrandingType;
  paymentId?: string;
}
export async function createGame(
  payload: ICreateGameArgs,
  rootUrl: string,
  domain: string,
  user?: IJwtUser
) {
  const {
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
    branding = {},
    paymentId = "",
  } = payload;
  const stack = buyInAmount;
  const config = await loadConfig();

  const productTitle =
    domain.indexOf("poker501.com") >= 0 ? "Poker501" : "Poker in Place";

  const hostNames: string[] = config.app.api_hostnames
    ? config.app.api_hostnames.split(",")
    : [];

  const tableDoc = await typedDb.collection<IServerGame>("tables").add({
    name: title,
    hands: [],
    players: user
      ? {
        [user.uid]: {
          active: true,
          stack,
          contributed: buyInAmount,
          position: -1,
          id: user.uid,
          name: user.name || user.uid,
          email: user.email || "",
          photoURL: user.picture || "",
          role: PlayerRole.Organizer,
          rebuys: [],
        },
      }
      : {},
    buyIn: buyInAmount,
    startingBigBlind: bigBlindAmount,
    currentBigBlind: bigBlindAmount,
    blindDoublingInterval: blindIncreaseDuration,
    increment: bigBlindAmount / 2,
    type,
    stage: GameStage.Initialized,
    mode,
    payType,
    organizerId: user ? user.uid : null,
    // tournamentDetails,
    prng: "mulberry32",
    hostedMedia: hostedMedia || config.app.default_hosted_media,
    features,
    branding,
    apiServerHost: hostNames[Math.floor(Math.random() * hostNames.length)],
  });

  const inviteEmails = emails.split(/;|,/g).filter((e) => e);
  if (user && inviteEmails.length) {
    sendInvite(
      [...inviteEmails, user.email].filter((e) => e),
      user,
      tableDoc.id,
      title,
      startDate,
      timeZone,
      mode,
      rootUrl,
      `${rootUrl}/table/${tableDoc.id}?join`
    );
  } else {
    // Just let me know there is a game
    sendInvite(
      ["nick@pokerinplace.app"].filter((e) => e),
      user,
      tableDoc.id,
      title,
      startDate,
      timeZone,
      mode,
      rootUrl,
      `${rootUrl}/table/${tableDoc.id}?join`
    );
  }

  let paymentSessionId: string;
  if (user) {
    const detailsDoc = await typedDb
      .collection<IUserDetails>("users")
      .doc(user.uid)
      .get();
    const userDetails: IUserDetails = detailsDoc.data() || {};

    // TODO - verify the subscription here
    const cost = getModeCost(
      mode,
      PayType.UpFront,
      userDetails.subscriptionType
    );

    // Allow lots of free ones
    if (cost === 0) {
      const isFree = getModeCost(mode, PayType.UpFront) === 0;
      await tableDoc.update({
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
          throw new Error("Invalid promo code");
        } else if (promoCodeDoc.data().redeemedBy) {
          throw new Error("Promo code already redeemed");
        }
        await promoCodeDoc.update({
          redeemedBy: user.uid,
          redeemedAt: new Date().toISOString(),
        });
      }
      if (promoCode) {
        await tableDoc.update({ paymentId: promoCode });
      } else {
        if (payType === "up-front") {
          let customer;
          try {
            if (user.email) {
              customer = await createCustomer(user.name, user.email);
            }
          } catch (e) {
            //
          }
          const stripeClient = await getStripeClient(domain);
          const session = await stripeClient.checkout.sessions.create({
            customer: customer ? customer.id : undefined,
            customer_email: customer ? undefined : user.email,
            payment_method_types: ["card"],
            line_items: [
              {
                name: `${productTitle} Premium Game`,
                description: `Up to ${getMaximumParticipants(
                  mode
                )} players for up to ${getMaximumDuration(mode) / 60} minutes`,
                images: [`${rootUrl}/logo-256.png`],
                amount: cost * 100, // pennies
                currency: "usd",
                quantity: 1,
              },
            ],
            success_url: `${rootUrl}/table/${tableDoc.id}?join&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${rootUrl}/?cancel`,
          });
          paymentSessionId = session.id;
          await tableDoc.update({ paymentSessionId });
        }
      }
    }
  } else {
    // Mark all non-user games as free for now
    // TODO - make this smarter
    await tableDoc.update({
      paymentId,
    });
  }

  if (features?.startWithVideoEnabled) {
    const tableDocDoc = await tableDoc.get();
    await enableVideo(tableDocDoc, user);
  }

  return { tableDoc, paymentSessionId };
}

export async function create(
  request: AuthenticatedRequest,
  response: express.Response,
  { getTable }: { getTable: GetTableFunction }
) {
  const requestBody = JSON.parse(request.body);
  const config = await loadConfig();
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
    mode = GameMode.Premium_8_120,
    type = GameType.Cash,
    payType = PayType.UpFront,
    code,
    startDate = new Date().toISOString(),
    timeZone = "America/Los_Angeles",
    features = {},
    hostedMedia,
    branding = {},
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
    features?: IGameFeatures;
    branding?: BrandingType;
  } = requestBody;

  try {
    const { tableDoc, paymentSessionId } = await createGame(
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
      },
      rootUrl,
      domain,
      request.user
    );
    return response.json({
      id: tableDoc.id,
      paymentSessionId,
    });
  } catch (e) {
    return response.json({ error: e.message });
  }
}

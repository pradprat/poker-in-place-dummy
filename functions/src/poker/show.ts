import express from "express";
import { GetTableFunction, AuthenticatedRequest } from "./lib";
import { IHand, IPlayerState, ShowCards } from "../engine/types";
import { getCardsToShow } from "../utils/getCardsToShow";

interface IRequestParams extends AuthenticatedRequest {
  query: {
    tableId: string;
    handId: string;
    show: ShowCards;
  };
}

/**
 * @swagger
 *
 * /show:
 *   post:
 *     tags: [Tables]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: tableId
 *         in: query
 *         required: true
 *         type: string
 *       - name: handId
 *         in: query
 *         required: true
 *         type: string
 *       - name: show
 *         in: query
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
 *           description: An object with boolean value to show hand of a table
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   show: 
 *                    type: boolean
 */
export async function show(
  request: IRequestParams,
  response: express.Response,
  { getTable }: { getTable: GetTableFunction }
) {
  const { tableId, handId, show: flip } = request.query;
  const tableDoc = await getTable(tableId, request.user.uid);
  if (!tableDoc) {
    return response.status(403).json({ error: "Unauthorized" });
  }

  const hand = await tableDoc.ref.collection<IHand>("hands").doc(handId).get();

  if (!hand.exists) {
    return response.status(403).json({ error: "Unauthorized" });
  }

  const playerState = await hand.ref
    .collection<IPlayerState>("players")
    .doc(request.user.uid)
    .get();

  if (playerState.exists) {
    let needsUpdate = false;
    const handPayouts = hand.data().payouts.map((p) => {
      if (p.uid === request.user.uid) {
        needsUpdate = true;

        return {
          ...p,
          cards: getCardsToShow({
            cards: playerState.data().cards,
            show: flip,
          }),
        };
      }
      return p;
    });
    if (needsUpdate) {
      // Add 5 more seconds
      await hand.update({
        payouts: handPayouts,
        payoutsEndTimestamp: hand.data().payoutsEndTimestamp + 5000,
      });
    }
  }

  return response.json({
    show: true,
  });
}

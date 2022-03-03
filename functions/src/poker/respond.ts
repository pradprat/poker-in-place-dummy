import express from "express";
import {
  AuthenticatedRequest,
  respondAndAdvanceHand,
} from "./lib";

import {
  ERROR_ADVANCE_WITHOUT_ACTION,
  ERROR_NOT_YOUR_TURN,
} from "../engine/index";

import { ActionDirective } from "../engine/types";

/**
 * @swagger
 *
 * /respond:
 *   post:
 *     tags: [Tables]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: tableId
 *         in: query
 *         required: true
 *         type: string
 *       - name: action
 *         in: query
 *         required: true
 *         type: string
 *       - name: amount
 *         in: query
 *         required: true
 *         type: number
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
 *         200:
 *           description: An object with directive to show successsful response of user in a table
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   directive: 
 *                    type: string
 */
export async function respond(
  request: AuthenticatedRequest,
  response: express.Response,
) {
  const tableId = request.query.tableId as string;
  const action = request.query.action as ActionDirective;
  const amount = parseFloat(request.query.amount as string);
  try {
    const uid = request.user.uid;
    const updates = await respondAndAdvanceHand(
      tableId,
      uid,
      action,
      amount
    );

    if (
      updates.error &&
      !(
        updates.error === ERROR_ADVANCE_WITHOUT_ACTION ||
        updates.error === ERROR_NOT_YOUR_TURN
      )
    ) {
      return response.status(500).json({ error: updates.error });
    }

    return response.json({
      directive: updates.directive,
      // error: updates.error,
    });
  } catch (e) {
    // Don't log these errors
    console.log(e);
    if (
      (e as any).message === ERROR_ADVANCE_WITHOUT_ACTION ||
      (e as any).message === ERROR_NOT_YOUR_TURN
    ) {
      return response.status(200).json({});
    }
    return response.status(500).json({ error: (e as any).message });
  }
}


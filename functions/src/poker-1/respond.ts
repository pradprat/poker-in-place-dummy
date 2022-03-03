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
      e.message === ERROR_ADVANCE_WITHOUT_ACTION ||
      e.message === ERROR_NOT_YOUR_TURN
    ) {
      return response.status(200).json({});
    }
    return response.status(500).json({ error: e.message });
  }
}


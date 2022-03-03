const {
  ERROR_ADVANCE_WITHOUT_ACTION,
  ERROR_NOT_YOUR_TURN,
} = require("../engine/index");

const { handleEnforceTimeout } = require("./lib");

/**
 * @swagger
 *
 * /timeout:
 *   post:
 *     tags: [Tables]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: tableId
 *         in: query
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
 *         200:
 *           description: An object with directive and error for timeout of user in a tournament
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   directive: 
 *                    type: string
 *                   error: 
 *                    type: string
 */
async function timeout(request, response, { getTable }) {
  const { tableId } = request.query;
  try {
    const uid = request.query.uid || request.user.uid;
    const updates = await handleEnforceTimeout(tableId, request.user.uid);

    if (updates.error) {
      return response.status(500).json({ error: updates.error });
    }

    return response.json({
      directive: updates.directive,
      error: updates.error,
    });
  } catch (e) {
    // Don't log these errors
    if (
      e.message === ERROR_ADVANCE_WITHOUT_ACTION ||
      e.message === ERROR_NOT_YOUR_TURN
    ) {
      return response.status(200).json({});
    }
    return response.status(500).json({ error: e.message });
  }
}

module.exports = { timeout };

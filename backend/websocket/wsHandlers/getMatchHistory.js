// wsHandlers/getMatchHistory.js
const db = require("../../services/db/dbService");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

/**
 * Handles the GET_MATCH_HISTORY WebSocket message.
 * Looks up the user by token and fetches their match history.
 */
async function getMatchHistory(data, ws) {
  const { token } = data;
  if (!token) return;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded?.id;

    const matches = await db.getMatchHistoryByUser(userId);

    ws.send(
      JSON.stringify({
        type: "MATCH_HISTORY",
        data: matches,
      })
    );
  } catch (err) {
    console.error("❌ Failed to get match history:", err.message);
    ws.send(
      JSON.stringify({
        type: "MATCH_HISTORY_ERROR",
        error: "Invalid token or failed to fetch history.",
      })
    );
  }
}

module.exports = getMatchHistory;

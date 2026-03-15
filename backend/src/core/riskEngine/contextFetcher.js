const { query } = require('../../config/db');
const {
  GET_SENDER_AVG_AMOUNT,
  GET_KNOWN_PAYEES,
  GET_RECENT_TRANSACTION_CONTEXT,
} = require('../../db/queries/transactionQueries');

async function fetchUserContext(senderUpiId) {
  const [avgResult, payeesResult, recentResult] = await Promise.all([
    query(GET_SENDER_AVG_AMOUNT,          [senderUpiId]),
    query(GET_KNOWN_PAYEES,               [senderUpiId]),
    query(GET_RECENT_TRANSACTION_CONTEXT, [senderUpiId]),
  ]);

  const avgAmount       = parseFloat(avgResult.rows[0]?.avg_amount) || 0;
  const knownPayees     = payeesResult.rows.map((r) => r.receiver_upi_id);
  const recentTimestamps = recentResult.rows.map((r) => r.timestamp);
  const lastLocation    = recentResult.rows[0]?.location || null;

  return { avgAmount, knownPayees, recentTimestamps, lastLocation };
}

module.exports = { fetchUserContext };
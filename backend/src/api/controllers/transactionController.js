/**
 * Transaction Controller
 * Handles REST API requests for the dashboard's initial data load.
 *
 * WHY REST + WebSocket together?
 * WebSocket handles the live stream.
 * REST handles: initial page load data, historical queries, stats.
 * The dashboard calls REST once on mount, then switches to WS for updates.
 */

const { query } = require('../../config/db');
const {
  GET_TRANSACTION_FEED,
  GET_ALERTS_WITH_TRANSACTIONS,
  GET_DASHBOARD_STATS,
} = require('../../db/queries/transactionQueries');
const { simulator } = require('../../core/simulator/simulator');
const { getConnectedClients } = require('../../websocket/wsServer');

// GET /api/transactions?limit=50&offset=0
async function getTransactions(req, res) {
  const limit  = Math.min(parseInt(req.query.limit)  || 50, 100); // cap at 100
  const offset = parseInt(req.query.offset) || 0;

  const result = await query(GET_TRANSACTION_FEED, [limit, offset]);
  res.json({ success: true, data: result.rows, count: result.rowCount });
}

// GET /api/alerts?limit=20
async function getAlerts(req, res) {
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  const result = await query(GET_ALERTS_WITH_TRANSACTIONS, [limit]);
  res.json({ success: true, data: result.rows, count: result.rowCount });
}

// GET /api/stats
async function getStats(req, res) {
  const result = await query(GET_DASHBOARD_STATS, []);
  res.json({
    success: true,
    data: {
      ...result.rows[0],
      connectedClients: getConnectedClients(),
      simulatorStatus:  simulator.getStats(),
    },
  });
}

// POST /api/simulator/start
async function startSimulator(req, res) {
  simulator.start();
  res.json({ success: true, message: 'Simulator started' });
}

// POST /api/simulator/stop
async function stopSimulator(req, res) {
  simulator.stop();
  res.json({ success: true, message: 'Simulator stopped' });
}

module.exports = {
  getTransactions,
  getAlerts,
  getStats,
  startSimulator,
  stopSimulator,
};

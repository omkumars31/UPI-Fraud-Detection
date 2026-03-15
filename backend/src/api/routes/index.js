const { Router } = require('express');
const {
  getTransactions,
  getAlerts,
  getStats,
  startSimulator,
  stopSimulator,
} = require('../controllers/transactionController');

const router = Router();

// Wrap async controllers — catches any thrown errors and forwards to errorHandler
const asyncWrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

router.get('/transactions',      asyncWrap(getTransactions));
router.get('/alerts',            asyncWrap(getAlerts));
router.get('/stats',             asyncWrap(getStats));
router.post('/simulator/start',  asyncWrap(startSimulator));
router.post('/simulator/stop',   asyncWrap(stopSimulator));
router.get('/health',            (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

module.exports = router;

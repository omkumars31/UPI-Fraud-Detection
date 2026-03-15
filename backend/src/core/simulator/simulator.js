const EventEmitter = require('events');
const { generateTransaction } = require('./transactionGenerator');
const { scoreTransaction }    = require('../riskEngine/engine');
const { fetchUserContext }    = require('../riskEngine/contextFetcher');
const { query }               = require('../../config/db');
const {
  INSERT_TRANSACTION,
  INSERT_ALERT,
} = require('../../db/queries/transactionQueries');

class TransactionSimulator extends EventEmitter {
  constructor(intervalMs = 2000) {
    super();
    this.intervalMs = intervalMs;
    this.timer      = null;
    this.isRunning  = false;
    this.stats      = { processed: 0, flagged: 0, errors: 0 };
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log(`[Simulator] Started — generating a transaction every ${this.intervalMs}ms`);
    this.timer = setInterval(() => this._processOne(), this.intervalMs);
    this.emit('status', { running: true, intervalMs: this.intervalMs });
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.isRunning = false;
    console.log('[Simulator] Stopped');
    this.emit('status', { running: false });
  }

  async _processOne() {
    try {
      // STEP 1: Generate
      const raw = generateTransaction();

      // STEP 2: Fetch context (3 parallel DB queries)
      const context = await fetchUserContext(raw.senderUpiId);

      // STEP 3: Score
      const result = scoreTransaction(raw, context);

      // STEP 4: Status
      const status = result.shouldAlert ? 'FLAGGED' : 'CLEARED';

      // STEP 5: Persist transaction
      const { rows } = await query(INSERT_TRANSACTION, [
        raw.senderUpiId,
        raw.receiverUpiId,
        raw.amount,
        raw.timestamp,
        raw.deviceId,
        raw.location,
        result.score,
        JSON.stringify(result.triggeredFlags),
        JSON.stringify(result.reasons),
        status,
      ]);
      const savedTransaction = rows[0];

      // STEP 6: Persist alert + trigger AI explanation (non-blocking)
      let savedAlert = null;
      if (result.shouldAlert) {
        const alertResult = await query(INSERT_ALERT, [
          savedTransaction.id,
          result.score,
          result.tier.label,
          null,  // AI explanation arrives separately — non-blocking
        ]);
        savedAlert = alertResult.rows[0];
        this.stats.flagged++;

        // Fire and forget — don't await
        // Transaction broadcasts instantly, AI explanation follows 1-3s later
        const { generateAlertExplanation } = require('../alertService/alertService');
        generateAlertExplanation(savedAlert.id, savedTransaction, result)
          .then((explanation) => {
            if (explanation) {
              this.emit('alert_updated', {
                alertId:       savedAlert.id,
                transactionId: savedTransaction.id,
                explanation,
                score:         result.score,
                tier:          result.tier,
              });
            }
          })
          .catch((err) => {
            console.error('[Simulator] Alert explanation error:', err.message);
          });
      }

      this.stats.processed++;

      // STEP 7: Emit — WebSocket server picks this up
      const payload = {
        transaction: {
          ...savedTransaction,
          _senderName:   raw._senderName,
          _receiverName: raw._receiverName,
        },
        scoring: {
          score:          result.score,
          tier:           result.tier,
          triggeredFlags: result.triggeredFlags,
          reasons:        result.reasons,
          breakdown:      result.breakdown,
          shouldAlert:    result.shouldAlert,
        },
        alert: savedAlert,
        meta: {
          processedAt:    new Date().toISOString(),
          totalProcessed: this.stats.processed,
        },
      };

      this.emit('transaction', payload);
      if (result.shouldAlert) this.emit('alert', payload);

    } catch (err) {
      this.stats.errors++;
      console.error('[Simulator] Pipeline error:', err.message);
      this.emit('error', { message: err.message, timestamp: new Date() });
    }
  }

  getStats() {
    return { ...this.stats, isRunning: this.isRunning };
  }
}

const simulator = new TransactionSimulator(2000);
module.exports = { simulator, TransactionSimulator };
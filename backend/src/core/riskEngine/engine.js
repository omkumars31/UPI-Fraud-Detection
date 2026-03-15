const {
  checkAmountAnomaly,
  checkNewPayee,
  checkTransactionVelocity,
  checkOddHours,
  checkLocationChange,
} = require('./signals');

const { getRiskTier, RISK_CONFIG } = require('../../config/riskConfig');

function scoreTransaction(transaction, context) {
  const { amount, receiverUpiId, timestamp, location } = transaction;
  const { avgAmount, knownPayees, recentTimestamps, lastLocation } = context;

  const signals = {
    AMOUNT_ANOMALY:       checkAmountAnomaly(amount, avgAmount),
    NEW_PAYEE:            checkNewPayee(receiverUpiId, knownPayees),
    TRANSACTION_VELOCITY: checkTransactionVelocity(recentTimestamps),
    ODD_HOURS:            checkOddHours(timestamp),
    LOCATION_CHANGE:      checkLocationChange(location, lastLocation),
  };

  let totalScore = 0;
  const triggeredFlags = [];
  const reasons = [];
  const breakdown = {};

  for (const [signalName, result] of Object.entries(signals)) {
    breakdown[signalName] = result.score;
    totalScore += result.score;
    if (result.triggered) {
      triggeredFlags.push(signalName);
      if (result.reason) reasons.push(result.reason);
    }
  }

  const finalScore = Math.min(totalScore, 100);
  const tier = getRiskTier(finalScore);
  const shouldAlert = finalScore >= RISK_CONFIG.ALERT_THRESHOLD;

  return { score: finalScore, tier, shouldAlert, triggeredFlags, reasons, breakdown };
}

module.exports = { scoreTransaction };
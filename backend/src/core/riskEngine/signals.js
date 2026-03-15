const { RISK_CONFIG } = require('../../config/riskConfig');

function checkAmountAnomaly(amount, avgAmount) {
  if (!avgAmount || avgAmount === 0) {
    const isLarge = amount > 10000;
    return {
      triggered: isLarge,
      score: isLarge ? RISK_CONFIG.WEIGHTS.AMOUNT_ANOMALY : 0,
      reason: isLarge ? `First large transaction: Rs.${amount} with no prior history` : null,
    };
  }
  const multiplier = amount / avgAmount;
  const triggered = multiplier >= RISK_CONFIG.AMOUNT_ANOMALY_MULTIPLIER;
  return {
    triggered,
    score: triggered ? RISK_CONFIG.WEIGHTS.AMOUNT_ANOMALY : 0,
    reason: triggered ? `Amount Rs.${amount} is ${multiplier.toFixed(1)}x above 30-day average of Rs.${avgAmount.toFixed(0)}` : null,
  };
}

function checkNewPayee(receiverUpiId, knownPayees) {
  const isNew = !knownPayees.includes(receiverUpiId);
  return {
    triggered: isNew,
    score: isNew ? RISK_CONFIG.WEIGHTS.NEW_PAYEE : 0,
    reason: isNew ? `First transaction to new payee: ${receiverUpiId}` : null,
  };
}

function checkTransactionVelocity(recentTimestamps) {
  const windowMs = RISK_CONFIG.VELOCITY_WINDOW_MINUTES * 60 * 1000;
  const now = Date.now();
  const count = recentTimestamps.filter(ts => now - new Date(ts).getTime() <= windowMs).length;
  const triggered = count > RISK_CONFIG.VELOCITY_MAX_TRANSACTIONS;
  return {
    triggered,
    score: triggered ? RISK_CONFIG.WEIGHTS.TRANSACTION_VELOCITY : 0,
    reason: triggered ? `${count} transactions in last ${RISK_CONFIG.VELOCITY_WINDOW_MINUTES} minutes (limit: ${RISK_CONFIG.VELOCITY_MAX_TRANSACTIONS})` : null,
  };
}

function checkOddHours(timestamp) {
  const hour = new Date(timestamp).getHours();
  const triggered = hour >= RISK_CONFIG.ODD_HOURS_START && hour < RISK_CONFIG.ODD_HOURS_END;
  return {
    triggered,
    score: triggered ? RISK_CONFIG.WEIGHTS.ODD_HOURS : 0,
    reason: triggered ? `Transaction at ${hour}:00 - suspicious hours (1AM-5AM)` : null,
  };
}

function checkLocationChange(currentLocation, lastLocation) {
  if (!lastLocation) return { triggered: false, score: 0, reason: null };
  const triggered = currentLocation && lastLocation &&
    currentLocation.toLowerCase() !== lastLocation.toLowerCase();
  return {
    triggered,
    score: triggered ? RISK_CONFIG.WEIGHTS.LOCATION_CHANGE : 0,
    reason: triggered ? `Location changed from ${lastLocation} to ${currentLocation}` : null,
  };
}

module.exports = {
  checkAmountAnomaly,
  checkNewPayee,
  checkTransactionVelocity,
  checkOddHours,
  checkLocationChange,
};
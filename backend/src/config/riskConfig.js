/**
 * Risk Engine Configuration
 *
 * WHY THIS FILE EXISTS:
 * All scoring weights and thresholds live here — not hardcoded in logic.
 * In production, these values would be stored in a DB or feature flag system
 * so fraud analysts can tune them without a code deployment.
 * This is called the "configuration-driven" design pattern.
 */

const RISK_CONFIG = {
  // --- Signal Weights (must sum to 100) ---
  WEIGHTS: {
    AMOUNT_ANOMALY: 30,      // Highest weight — amount is the clearest fraud signal
    NEW_PAYEE: 20,           // Second — sending to unknown receiver is high risk
    TRANSACTION_VELOCITY: 25, // Rapid-fire transactions = account takeover pattern
    ODD_HOURS: 15,           // Fraud often happens when victim is asleep
    LOCATION_CHANGE: 10,     // Softer signal — VPNs and travel create false positives
  },

  // --- Thresholds ---
  AMOUNT_ANOMALY_MULTIPLIER: 3.0,   // Flag if amount > 3x the user's 30-day average
  VELOCITY_WINDOW_MINUTES: 10,      // Look-back window for velocity check
  VELOCITY_MAX_TRANSACTIONS: 3,     // Max allowed transactions in that window
  ODD_HOURS_START: 1,               // 1:00 AM
  ODD_HOURS_END: 5,                 // 5:00 AM

  // --- Risk Tiers (score ranges) ---
  TIERS: {
    LOW: { min: 0, max: 39, label: 'LOW', color: 'green' },
    MEDIUM: { min: 40, max: 59, label: 'MEDIUM', color: 'yellow' },
    HIGH: { min: 60, max: 79, label: 'HIGH', color: 'orange' },
    CRITICAL: { min: 80, max: 100, label: 'CRITICAL', color: 'red' },
  },

  // --- Alert Threshold ---
  ALERT_THRESHOLD: 60,  // Transactions scoring >= 60 trigger an AI alert
};

/**
 * Returns the risk tier for a given score.
 * @param {number} score - Risk score (0-100)
 * @returns {object} Tier object with label and color
 */
function getRiskTier(score) {
  return Object.values(RISK_CONFIG.TIERS).find(
    (tier) => score >= tier.min && score <= tier.max
  );
}

module.exports = { RISK_CONFIG, getRiskTier };
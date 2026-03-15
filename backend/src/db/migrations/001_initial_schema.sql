-- ============================================================
-- Migration 001: Initial Schema
-- UPI Fraud Detection System
--
-- Design decisions worth knowing for interviews:
--
-- 1. UUID primary keys (not serial integers)
--    Why: Distributed systems can generate UUIDs without
--    a central DB sequence. Prevents ID enumeration attacks.
--
-- 2. TIMESTAMPTZ (not TIMESTAMP)
--    Why: Stores timezone info. UPI is India-only now, but
--    a payment system must always be timezone-aware.
--
-- 3. JSONB for risk_flags (not 5 boolean columns)
--    Why: Flexible — add a 6th signal without a schema migration.
--    JSONB is indexed and queryable in Postgres.
--
-- 4. DECIMAL(12,2) for amounts (not FLOAT)
--    Why: FLOAT has rounding errors. Financial data requires
--    exact decimal arithmetic. This is a classic interview trap.
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upi_id       VARCHAR(50)  UNIQUE NOT NULL,
  name         VARCHAR(100) NOT NULL,
  city         VARCHAR(100),
  created_at   TIMESTAMPTZ  DEFAULT NOW()
);

-- ── Transactions ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_upi_id   VARCHAR(50)    NOT NULL,
  receiver_upi_id VARCHAR(50)    NOT NULL,
  amount          DECIMAL(12, 2) NOT NULL,
  timestamp       TIMESTAMPTZ    DEFAULT NOW(),
  device_id       VARCHAR(100),
  location        VARCHAR(100),
  risk_score      INTEGER        DEFAULT 0,
  risk_flags      JSONB,
  risk_reasons    JSONB,
  status          VARCHAR(20)    DEFAULT 'PENDING',

  CONSTRAINT valid_amount     CHECK (amount > 0),
  CONSTRAINT valid_risk_score CHECK (risk_score BETWEEN 0 AND 100),
  CONSTRAINT valid_status     CHECK (status IN ('PENDING', 'FLAGGED', 'CLEARED'))
);

-- ── Alerts ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alerts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id  UUID         REFERENCES transactions(id) ON DELETE CASCADE,
  risk_score      INTEGER      NOT NULL,
  risk_tier       VARCHAR(20),
  ai_explanation  TEXT,
  triggered_at    TIMESTAMPTZ  DEFAULT NOW(),
  acknowledged    BOOLEAN      DEFAULT FALSE
);

-- ── Indexes ──────────────────────────────────────────────────
-- These are the indexes that make the context fetcher fast.
-- Each one corresponds to a specific query the engine needs.

-- Velocity check: "give me all txns by this sender in last 10 mins"
CREATE INDEX IF NOT EXISTS idx_txn_sender_time
  ON transactions(sender_upi_id, timestamp DESC);

-- Amount average: "give me 30-day txns for this sender"
CREATE INDEX IF NOT EXISTS idx_txn_sender_status
  ON transactions(sender_upi_id, status);

-- Known payees: "give me all receivers this sender has paid"
CREATE INDEX IF NOT EXISTS idx_txn_receiver
  ON transactions(receiver_upi_id);

-- Dashboard feed: "give me latest transactions"
CREATE INDEX IF NOT EXISTS idx_txn_timestamp
  ON transactions(timestamp DESC);

-- Alert feed: "give me recent high-risk alerts"
CREATE INDEX IF NOT EXISTS idx_alerts_triggered
  ON alerts(triggered_at DESC);

-- Risk score leaderboard
CREATE INDEX IF NOT EXISTS idx_txn_risk_score
  ON transactions(risk_score DESC);
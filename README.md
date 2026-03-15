# Real-Time UPI Fraud Detection & Alert System

A production-grade fraud detection pipeline that scores UPI transactions in real-time using a 5-signal rule-based risk engine, broadcasts results via WebSocket, and generates AI-powered analyst explanations for flagged transactions.

> Built to demonstrate fintech backend engineering — the kind of system Fiserv's payment infrastructure teams work on daily.

---

## What It Does

- Simulates a live stream of UPI transactions every 2 seconds
- Scores each transaction across 5 fraud signals (0–100 risk score)
- Broadcasts results live to a React dashboard via WebSocket
- Flags transactions scoring ≥ 60 and generates a 3-line AI analyst explanation via Gemini
- All of this in under 2 seconds end to end

---

## The Demo

Open the dashboard. The transaction feed ticks live. A suspicious transaction comes in — risk score hits 85, gets flagged, and an AI-generated alert appears explaining exactly why — all in under 2 seconds.

---

## Architecture
```
Transaction Simulator (every 2s)
         ↓
Context Fetcher — 3 parallel DB queries via Promise.all()
         ↓
Risk Scoring Engine — 5 signals, rule-based, fully explainable
         ↓
PostgreSQL — persisted with JSONB flags, DECIMAL amounts
         ↓
WebSocket Broadcast — EventEmitter → WS bridge
         ↓
React Dashboard — live feed + alert panel
         ↓ (async, non-blocking)
Gemini AI — 3-line fraud analyst explanation
```

---

## Risk Scoring Engine

Five signals contribute to a 0–100 risk score:

| Signal | Weight | Detection Logic |
|--------|--------|----------------|
| Amount Anomaly | 30 | Amount > 3× user's 30-day average |
| Transaction Velocity | 25 | >3 transactions in last 10 minutes |
| New Payee | 20 | Receiver never paid before |
| Odd Hours | 15 | Transaction between 1AM–5AM |
| Location Change | 10 | Different city from last transaction |

**Score ≥ 60 → FLAGGED → AI alert generated**

**Why rule-based over ML?**
RBI regulations require explainability in payment systems. Rule-based scoring allows fraud analysts to audit every decision, tune weights without retraining a model, and provide clear customer-facing reasons for flags.

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Backend | Node.js + Express | Event-driven, non-blocking I/O |
| Database | PostgreSQL | ACID compliance, JSONB, DECIMAL precision |
| Real-time | WebSockets (ws) | Sub-100ms broadcast latency |
| AI Layer | Gemini API | Explainable fraud analyst alerts |
| Frontend | React + Vite + Tailwind v4 | Fast, live dashboard |
| Pattern | EventEmitter | Decouples transport from business logic |

---

## Key Engineering Decisions

**1. Pure functions for signal detection**
Each of the 5 signals is a pure function — no DB calls, no side effects. The engine receives pre-fetched context, making it fully unit-testable in isolation.

**2. Parallel DB queries — N+1 solution**
The context fetcher uses `Promise.all()` to fire 3 DB queries simultaneously. Total wait time = slowest single query, not the sum. Reduces per-transaction DB latency by ~60% vs sequential queries.

**3. Non-blocking AI integration**
Gemini is called fire-and-forget after the transaction is persisted and broadcast. The dashboard shows "Analyzing..." instantly, then receives the AI explanation via a separate `ALERT_UPDATED` WebSocket event when Gemini responds.

**4. EventEmitter → WebSocket bridge**
The simulator emits events. The WS server subscribes. The simulator has zero knowledge of WebSockets — swap the transport layer (SSE, Kafka, etc.) without touching business logic.

**5. Financial data types**
`DECIMAL(12,2)` not `FLOAT` for all amounts. Floating point binary arithmetic has rounding errors — unacceptable in payment systems.

**6. Graceful degradation**
If Gemini is unavailable or rate-limited, a rule-based fallback explanation is generated immediately. The core pipeline never blocks on an external API.

---

## Project Structure
```
upi-fraud-detection/
├── backend/
│   └── src/
│       ├── core/
│       │   ├── riskEngine/        # engine.js · signals.js · contextFetcher.js
│       │   ├── simulator/         # simulator.js · transactionGenerator.js · transactionData.js
│       │   └── alertService/      # alertService.js (Gemini integration)
│       ├── api/
│       │   ├── routes/            # index.js
│       │   ├── controllers/       # transactionController.js
│       │   └── middleware/        # errorHandler.js
│       ├── db/
│       │   ├── migrations/        # 001_initial_schema.sql
│       │   └── queries/           # transactionQueries.js
│       ├── websocket/             # wsServer.js
│       └── config/                # db.js · riskConfig.js
└── frontend/
    └── src/
        ├── hooks/                 # useWebSocket.js
        ├── services/              # api.js
        └── components/            # TransactionFeed · AlertPanel · StatCard · RiskBadge
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check + uptime |
| GET | `/api/transactions` | Paginated transaction feed |
| GET | `/api/alerts` | Recent alerts with AI explanations |
| GET | `/api/stats` | Dashboard stats (24h window) |
| POST | `/api/simulator/start` | Start transaction simulator |
| POST | `/api/simulator/stop` | Stop transaction simulator |

**WebSocket:** `ws://localhost:3001`

| Event | Direction | Payload |
|-------|-----------|---------|
| `TRANSACTION` | Server → Client | Scored transaction + breakdown |
| `ALERT` | Server → Client | Flagged transaction + alert record |
| `ALERT_UPDATED` | Server → Client | AI explanation when Gemini responds |
| `SIMULATOR_STATUS` | Server → Client | Start/stop status |

---

## Local Setup

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Gemini API key (free tier) — get one at https://aistudio.google.com/app/apikey

### Backend
```bash
cd backend
cp .env.example .env
# Add your GEMINI_API_KEY to .env

npm install

# Create database and run migration
psql -U postgres -c "CREATE DATABASE upi_fraud;"
psql -U postgres -d upi_fraud -f src/db/migrations/001_initial_schema.sql

npm run dev
# Server running at http://localhost:3001
# WebSocket ready at ws://localhost:3001
```

### Frontend
```bash
# In a new terminal tab
cd frontend
npm install
npm run dev
# Dashboard at http://localhost:5173
```

---

## Environment Variables

Create `backend/.env`:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=upi_fraud
DB_USER=postgres
DB_PASSWORD=postgres
PORT=3001
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## Database Schema

Three tables — each decision is intentional:

- **`transactions`** — `DECIMAL(12,2)` for amounts (not FLOAT), `JSONB` for risk flags (flexible, indexed, no schema migration needed to add signals), `TIMESTAMPTZ` for timezone-aware timestamps
- **`alerts`** — linked to transactions, stores AI explanation, acknowledged status
- **`users`** — UPI account registry

Six targeted indexes — each maps to a specific query the risk engine needs.

---

## Running Tests
```bash
cd backend
npm test
```

Unit tests cover all 5 signal functions independently, combined scoring scenarios, tier classification, and the `shouldAlert` threshold.

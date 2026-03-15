/**
 * Server Entry Point
 * Boots Express, attaches WebSocket, starts simulator.
 *
 * ORDER MATTERS:
 * 1. Create Express app
 * 2. Create HTTP server from it (needed for WS to share the same port)
 * 3. Init WebSocket server on the HTTP server
 * 4. Start simulator AFTER WS is ready (so first events have listeners)
 * 5. Listen
 */

require('dotenv').config();
const express    = require('express');
const http       = require('http');
const cors       = require('cors');
const routes     = require('./api/routes/index');
const { errorHandler }        = require('./api/middleware/errorHandler');
const { initWebSocketServer } = require('./websocket/wsServer');
const { simulator }           = require('./core/simulator/simulator');

const app    = express();
const server = http.createServer(app);
const PORT   = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────
app.use(cors({ origin: 'http://localhost:5173' })); // Vite default port
app.use(express.json());

// ── REST Routes ───────────────────────────────────────────────
app.use('/api', routes);

// ── Error Handler (must be last middleware) ───────────────────
app.use(errorHandler);

// ── WebSocket Server ──────────────────────────────────────────
initWebSocketServer(server);

// ── Start ─────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`[Server] Running on http://localhost:${PORT}`);
  console.log(`[Server] WebSocket ready on ws://localhost:${PORT}`);

  // Auto-start simulator after 1 second (gives DB pool time to warm up)
  setTimeout(() => {
    simulator.start();
  }, 1000);
});

module.exports = { app, server };
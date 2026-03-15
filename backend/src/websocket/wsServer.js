const WebSocket = require('ws');
const { simulator } = require('../core/simulator/simulator');

let wss = null;

function broadcast(type, data) {
  if (!wss) return;

  const message = JSON.stringify({ type, data, timestamp: new Date().toISOString() });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(message);
      } catch (err) {
        console.error('[WS] Failed to send to client:', err.message);
      }
    }
  });
}

function initWebSocketServer(httpServer) {
  wss = new WebSocket.Server({ server: httpServer });

  console.log('[WS] WebSocket server initialized');

  wss.on('connection', (ws, req) => {
    const clientIp = req.socket.remoteAddress;
    console.log(`[WS] Client connected: ${clientIp} | Total: ${wss.clients.size}`);

    ws.send(JSON.stringify({
      type: 'CONNECTED',
      data: {
        message: 'Connected to UPI Fraud Detection System',
        simulatorStatus: simulator.getStats(),
      },
      timestamp: new Date().toISOString(),
    }));

    ws.on('close', () => {
      console.log(`[WS] Client disconnected | Remaining: ${wss.clients.size}`);
    });

    ws.on('error', (err) => {
      console.error('[WS] Client error:', err.message);
    });
  });

  // ── Simulator → WebSocket bridge ───────────────────────────

  simulator.on('transaction', (payload) => {
    broadcast('TRANSACTION', payload);
  });

  simulator.on('alert', (payload) => {
    broadcast('ALERT', payload);
  });

  // NEW: broadcasts AI explanation when Gemini responds (1-3s after alert)
  simulator.on('alert_updated', (payload) => {
    broadcast('ALERT_UPDATED', payload);
  });

  simulator.on('status', (status) => {
    broadcast('SIMULATOR_STATUS', status);
  });

  simulator.on('error', (err) => {
    broadcast('SIMULATOR_ERROR', err);
  });

  return wss;
}

function getConnectedClients() {
  return wss ? wss.clients.size : 0;
}

module.exports = { initWebSocketServer, broadcast, getConnectedClients };
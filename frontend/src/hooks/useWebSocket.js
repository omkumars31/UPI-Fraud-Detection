import { useEffect, useRef, useState, useCallback } from 'react';

const WS_URL = 'ws://localhost:3001';
const RECONNECT_DELAY_MS = 3000;
const MAX_FEED_SIZE = 50; // keep last 50 transactions in memory

export function useWebSocket() {
  const [transactions, setTransactions]   = useState([]);
  const [alerts, setAlerts]               = useState([]);
  const [stats, setStats]                 = useState(null);
  const [connected, setConnected]         = useState(false);
  const wsRef                             = useRef(null);
  const reconnectTimer                    = useRef(null);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        console.log('[WS] Connected');
        if (reconnectTimer.current) {
          clearTimeout(reconnectTimer.current);
          reconnectTimer.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const { type, data } = JSON.parse(event.data);

          if (type === 'TRANSACTION') {
            setTransactions((prev) => [data, ...prev].slice(0, MAX_FEED_SIZE));
            // Update stats counters live
            setStats((prev) => prev ? {
              ...prev,
              total_transactions: parseInt(prev.total_transactions) + 1,
              flagged_count: data.scoring.shouldAlert
                ? parseInt(prev.flagged_count) + 1
                : parseInt(prev.flagged_count),
            } : prev);
          }

          if (type === 'ALERT') {
            setAlerts((prev) => [data, ...prev].slice(0, 20));
          }

          if (type === 'ALERT_UPDATED') {
            // Replace the alert's explanation when Gemini responds
            setAlerts((prev) => prev.map((a) =>
              a.alert?.id === data.alertId
                ? { ...a, alert: { ...a.alert, ai_explanation: data.explanation } }
                : a
            ));
          }
        } catch (err) {
          console.error('[WS] Message parse error:', err);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        console.log('[WS] Disconnected — reconnecting in 3s');
        reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY_MS);
      };

      ws.onerror = (err) => {
        console.error('[WS] Error:', err);
        ws.close();
      };

    } catch (err) {
      console.error('[WS] Connection failed:', err);
      reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY_MS);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [connect]);

  return { transactions, alerts, stats, setStats, connected };
}
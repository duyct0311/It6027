import { useState, useEffect, useRef, useCallback } from 'react';

export const useWebSocket = (onMessageCallback) => {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);

  const connect = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = import.meta.env.VITE_WS_URL || `${protocol}//${window.location.host}/ws/dashboard`;
    const wsUrl = `${host}?token=${token}`;

    console.log('[WebSocket] Connecting to dashboard feed:', wsUrl);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('[WebSocket] Dashboard feed connected');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (onMessageCallback) {
          onMessageCallback(payload);
        }
      } catch (err) {
        console.error('[WebSocket] Error parsing message payload:', err);
      }
    };

    ws.onclose = () => {
      console.log('[WebSocket] Dashboard feed disconnected. Reconnecting in 3s...');
      setIsConnected(false);
      setTimeout(() => {
        if (localStorage.getItem('token')) {
          connect();
        }
      }, 3000);
    };

    ws.onerror = (err) => {
      console.error('[WebSocket] Error:', err);
      ws.close();
    };

    wsRef.current = ws;
  }, [onMessageCallback]);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return { isConnected };
};

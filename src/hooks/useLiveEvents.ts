/**
 * @file hooks/useLiveEvents.ts
 * WebSocket hook useLiveEvents() with reconnect and exponential backoff.
 * In mock mode (or when no active backend WebSocket server is present),
 * it emits scripted live edge events and keeps telemetry synchronized.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { LiveEventPayload } from '../types/contract';
import { isRealBackendMode } from '../services/api';

export type ConnectionStatus = 'Connected' | 'Reconnecting' | 'Offline';

export interface UseLiveEventsOptions {
  onEvent?: (event: LiveEventPayload) => void;
  mockIntervalMs?: number;
  maxReconnectAttempts?: number;
}

export interface UseLiveEventsReturn {
  status: ConnectionStatus;
  lastEvent: LiveEventPayload | null;
  reconnectCount: number;
  manualReconnect: () => void;
}

export function useLiveEvents(options: UseLiveEventsOptions = {}): UseLiveEventsReturn {
  const { onEvent, mockIntervalMs = 8000, maxReconnectAttempts = 5 } = options;

  const [status, setStatus] = useState<ConnectionStatus>(
    isRealBackendMode ? 'Reconnecting' : 'Connected'
  );
  const [lastEvent, setLastEvent] = useState<LiveEventPayload | null>(null);
  const [reconnectCount, setReconnectCount] = useState<number>(0);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const mockTimerRef = useRef<any>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  // Dispatch event helper
  const handleEventDispatched = useCallback((event: LiveEventPayload) => {
    setLastEvent(event);
    if (onEventRef.current) {
      try {
        onEventRef.current(event);
      } catch (err) {
        console.error('Error handling live event in callback:', err);
      }
    }
  }, []);

  // Scripted mock events generator for mock mode
  useEffect(() => {
    if (isRealBackendMode) return;

    setStatus('Connected');

    // Scripted events pool mimicking edge sensor bursts
    const scriptedEvents: LiveEventPayload[] = [
      {
        type: 'vision.headcount',
        roomId: 'room-204',
        observedHeadcount: 0,
        timestamp: '10:18:24',
      },
      {
        type: 'sensor.reading',
        reading: {
          deviceId: 'PIR-204',
          source: 'ESP32',
          roomId: 'room-204',
          type: 'PIR_MOTION',
          value: false,
          unit: 'state',
          timestamp: 'Just now',
          note: 'demo data',
        },
      },
      {
        type: 'edge.heartbeat',
        deviceId: 'PI-GW-CSE-02',
        status: 'ONLINE',
        timestamp: new Date().toISOString(),
      },
      {
        type: 'room.updated',
        roomId: 'room-204',
        updates: { energyKw: 3.4 },
      },
      {
        type: 'sensor.reading',
        reading: {
          deviceId: 'PWR-204',
          source: 'PI',
          roomId: 'room-204',
          type: 'POWER_CURRENT',
          value: 3.4,
          unit: 'kW',
          timestamp: 'Just now',
          note: 'demo data',
        },
      },
    ];

    let scriptIndex = 0;
    const interval = setInterval(() => {
      const nextEvent = scriptedEvents[scriptIndex % scriptedEvents.length];
      scriptIndex++;
      handleEventDispatched(nextEvent);
    }, mockIntervalMs);

    mockTimerRef.current = interval;

    return () => {
      if (mockTimerRef.current) clearInterval(mockTimerRef.current);
    };
  }, [handleEventDispatched, mockIntervalMs]);

  // Real WebSocket connection with exponential backoff for real backend mode
  const connectWebSocket = useCallback(() => {
    if (!isRealBackendMode) return;

    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    setStatus('Reconnecting');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/ws/events`;

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setStatus('Connected');
        setReconnectCount(0);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as LiveEventPayload;
          handleEventDispatched(payload);
        } catch (err) {
          console.warn('Non-JSON WebSocket event message received:', event.data);
        }
      };

      ws.onerror = () => {
        // ws.onclose handles state transition and backoff
      };

      ws.onclose = () => {
        setStatus((prev) => (prev === 'Connected' ? 'Reconnecting' : prev));
        socketRef.current = null;

        // Exponential backoff
        setReconnectCount((prev) => {
          const nextCount = prev + 1;
          if (nextCount > maxReconnectAttempts) {
            setStatus('Offline');
            return nextCount;
          }

          const delay = Math.min(1000 * Math.pow(2, nextCount), 15000);
          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, delay);

          return nextCount;
        });
      };
    } catch {
      setStatus('Offline');
    }
  }, [handleEventDispatched, maxReconnectAttempts]);

  useEffect(() => {
    if (isRealBackendMode) {
      connectWebSocket();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connectWebSocket]);

  const manualReconnect = () => {
    if (isRealBackendMode) {
      setReconnectCount(0);
      connectWebSocket();
    } else {
      setStatus('Connected');
    }
  };

  return {
    status,
    lastEvent,
    reconnectCount,
    manualReconnect,
  };
}

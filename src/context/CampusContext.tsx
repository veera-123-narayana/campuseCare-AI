import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Alert,
  CampusEvent,
  EdgeDevice,
  EmergencyRequest,
  EnergySummary,
  Room,
  UserProfile,
  UserRole,
} from '../types';
import { NoticeboardEventItem } from '../types/noticeboard';
import { api, isRealBackendMode, setPiReadingListener } from '../services/api';
import { useLiveEvents, ConnectionStatus } from '../hooks/useLiveEvents';

export type DataMode = 'SIMULATION' | 'PI CONNECTED';

interface CampusContextType {
  rooms: Room[];
  alerts: Alert[];
  devices: EdgeDevice[];
  energySummary: EnergySummary | null;
  events: CampusEvent[];
  loading: boolean;
  error: string | null;
  dataMode: DataMode;
  setDataMode: (mode: DataMode) => void;
  toggleDataMode: () => void;
  recordPiReading: () => void;
  isDevMode: boolean;
  connectionStatus: ConnectionStatus;
  reconnectConnection: () => void;
  currentUser: UserProfile;
  switchRole: (role: UserRole) => void;
  activeAlertCount: number;
  refreshData: () => Promise<void>;
  acknowledgeAlert: (id: string) => Promise<void>;
  resolveAlert: (id: string, note?: string) => Promise<void>;
  assignAlert: (id: string, assignee: string) => Promise<void>;
  bulkUpdateAlerts: (
    ids: string[],
    action: 'Acknowledge' | 'Resolve' | 'Assign',
    assignee?: string,
    note?: string
  ) => Promise<void>;
  restoreAlertsSnapshot: (snapshot: Alert[]) => void;
  createEmergency: (req: {
    requesterName: string;
    requesterRole: 'Student' | 'Faculty' | 'Staff' | 'Admin / HOD';
    locationRoomId: string;
    locationDetail: string;
    type: 'MEDICAL' | 'PERIMETER' | 'INFRASTRUCTURE' | 'FIRE_HAZARD';
    notes: string;
  }) => Promise<EmergencyRequest>;
  runScenario: (scenarioId: string) => Promise<void>;
  isSimulationMode: boolean;
  toggleSimulationMode: () => void;
  setSimulationMode: (active: boolean) => void;
  updateRoomLive: (roomId: string, updates: Partial<Room>) => void;
  activeScenarioId: string | null;
  setActiveScenarioId: (id: string | null) => void;
  isDeviceOfflineSimulated: boolean;
  setIsDeviceOfflineSimulated: (offline: boolean) => void;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  backendOffline: boolean;
  noticeboardEvents: NoticeboardEventItem[];
  addNoticeboardEvent: (event: Omit<NoticeboardEventItem, 'id'>) => void;
  removeNoticeboardEvent: (id: string) => void;
  toggleNoticeboardEventApproval: (id: string, approved: boolean) => void;
}

const defaultUserProfiles: Record<UserRole, UserProfile> = {
  'Admin / HOD': {
    name: 'Dr. Aris Vance',
    role: 'Admin / HOD',
    department: 'Computer Science & Engineering',
    avatarInitials: 'AV',
  },
  Faculty: {
    name: 'Dr. Suresh Varma',
    role: 'Faculty',
    department: 'Artificial Intelligence & Data Systems',
    avatarInitials: 'SV',
  },
  Student: {
    name: 'Kavya Raman',
    role: 'Student',
    department: 'CSE Year 4 (Roll: 2023-CS-042)',
    avatarInitials: 'KR',
  },
};

const CampusContext = createContext<CampusContextType | undefined>(undefined);

// Helper to check whether a timestamp string or number is within the last 60 seconds
function isWithinLast60Seconds(timestamp?: string | number | null): boolean {
  if (!timestamp) return false;

  if (typeof timestamp === 'number') {
    const now = Date.now();
    const timeMs = timestamp < 1e11 ? timestamp * 1000 : timestamp;
    const diff = now - timeMs;
    return diff >= -5000 && diff <= 60000;
  }

  const str = String(timestamp).trim();
  const lower = str.toLowerCase();

  if (lower === 'just now') return true;

  const secMatch = lower.match(/^(\d+)\s*(?:s|sec|second|seconds)(?:\s*ago)?$/);
  if (secMatch) {
    const seconds = parseInt(secMatch[1], 10);
    return seconds <= 60;
  }

  if (
    lower.includes('min') ||
    lower.includes('hour') ||
    lower.includes('day') ||
    lower.includes('week') ||
    lower.includes('month') ||
    lower.includes('year') ||
    lower.includes('m ago') ||
    lower.includes('h ago') ||
    lower.includes('d ago')
  ) {
    return false;
  }

  const timeOnlyMatch = str.match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
  if (timeOnlyMatch) {
    const now = new Date();
    const target = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      parseInt(timeOnlyMatch[1], 10),
      parseInt(timeOnlyMatch[2], 10),
      parseInt(timeOnlyMatch[3], 10)
    );
    const diff = Math.abs(now.getTime() - target.getTime());
    return diff <= 60000;
  }

  const parsed = Date.parse(str);
  if (!isNaN(parsed)) {
    const diff = Date.now() - parsed;
    return diff >= -5000 && diff <= 60000;
  }

  return false;
}

export const CampusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [devices, setDevices] = useState<EdgeDevice[]>([]);
  const [energySummary, setEnergySummary] = useState<EnergySummary | null>(null);
  const [events, setEvents] = useState<CampusEvent[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [backendOffline, setBackendOffline] = useState<boolean>(false);
  const [dataMode, setDataMode] = useState<DataMode>('SIMULATION');
  const [lastPiReadingTime, setLastPiReadingTime] = useState<number | null>(null);
  const [devModeOverride, setDevModeOverride] = useState<DataMode | null>(null);
  const isDevMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('dev') === '1';
  const [currentUser, setCurrentUser] = useState<UserProfile>(defaultUserProfiles['Admin / HOD']);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isSimulationMode, setIsSimulationMode] = useState<boolean>(true);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [isDeviceOfflineSimulated, setIsDeviceOfflineSimulated] = useState<boolean>(false);
  const [noticeboardEvents, setNoticeboardEvents] = useState<NoticeboardEventItem[]>([
    {
      id: 'evt-default-1',
      title: 'Department Faculty Meeting (CSE)',
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '18:00',
      affectedRooms: ['room-204'],
      note: 'Simulated faculty administrative meeting on noticeboard.',
      approved: false,
    },
  ]);

  const addNoticeboardEvent = useCallback((event: Omit<NoticeboardEventItem, 'id'>) => {
    const newId = `evt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setNoticeboardEvents((prev) => [
      ...prev,
      { ...event, id: newId },
    ]);
  }, []);

  const removeNoticeboardEvent = useCallback((id: string) => {
    setNoticeboardEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const toggleNoticeboardEventApproval = useCallback((id: string, approved: boolean) => {
    setNoticeboardEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, approved } : e))
    );
  }, []);

  // Set the Pi-connected timestamp when dashboard receives qualifying PI telemetry in HTTP mode
  // In mock mode, this path must never run
  const recordPiReading = useCallback(() => {
    if (!isRealBackendMode) return;
    setLastPiReadingTime(Date.now());
  }, []);

  useEffect(() => {
    if (!isRealBackendMode) return;
    setPiReadingListener(recordPiReading);
    return () => {
      setPiReadingListener(null);
    };
  }, [recordPiReading]);

  // Live WebSocket event integration with backoff and graceful offline preservation
  const handleLiveEvent = useCallback((event: import('../types/contract').LiveEventPayload) => {
    // In HTTP mode only (VITE_DATA_MODE=http), detect incoming PI telemetry with recent timestamp
    // Heartbeats alone must NOT count; only a sensor or vision reading counts
    // In mock mode, this path must never run
    if (isRealBackendMode) {
      if (event.type === 'sensor.reading' && event.reading) {
        if (event.reading.source === 'PI' && isWithinLast60Seconds(event.reading.timestamp)) {
          recordPiReading();
        }
      } else if (event.type === 'vision.headcount') {
        const evSource = (event as any).source || 'PI';
        if (evSource === 'PI' && isWithinLast60Seconds(event.timestamp)) {
          recordPiReading();
        }
      } else if (event.type === 'room.updated') {
        const evSource = (event.updates as any)?.source;
        if (evSource === 'PI') {
          recordPiReading();
        }
      }
      // Note: event.type === 'edge.heartbeat' is deliberately excluded (heartbeats alone do NOT count)
    }

    if (event.type === 'alert.created') {
      setAlerts((prev) => [event.alert, ...prev.filter((a) => a.id !== event.alert.id)]);
    } else if (event.type === 'alert.updated') {
      setAlerts((prev) => prev.map((a) => (a.id === event.alert.id ? event.alert : a)));
    } else if (event.type === 'room.updated') {
      setRooms((prev) =>
        prev.map((r) => (r.id === event.roomId ? { ...r, ...event.updates } : r))
      );
    } else if (event.type === 'vision.headcount') {
      setRooms((prev) =>
        prev.map((r) =>
          r.id === event.roomId
            ? {
                ...r,
                observedHeadcount: event.observedHeadcount,
                motionDetected: event.observedHeadcount > 0 || r.motionDetected,
              }
            : r
        )
      );
    } else if (event.type === 'edge.heartbeat') {
      setDevices((prev) =>
        prev.map((d) =>
          d.deviceId === event.deviceId ? { ...d, status: event.status, lastPing: 'Just now' } : d
        )
      );
    }
  }, []);

  const { status: connectionStatus, manualReconnect: reconnectConnection } = useLiveEvents({
    onEvent: handleLiveEvent,
  });

  const toggleSimulationMode = () => {
    setIsSimulationMode((prev) => !prev);
  };

  const setSimulationMode = (active: boolean) => {
    setIsSimulationMode(active);
  };

  const updateRoomLive = (roomId: string, updates: Partial<Room>) => {
    setRooms((prev) =>
      prev.map((r) => (r.id === roomId ? { ...r, ...updates } : r))
    );
  };

  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setBackendOffline(false);
      const [roomsRes, alertsRes, devicesRes, energyRes, eventsRes] = await Promise.all([
        api.getRooms(),
        api.getAlerts(),
        api.getDevices(),
        api.getEnergySummary(),
        api.getEvents(),
      ]);
      setRooms(roomsRes);
      setAlerts(alertsRes);
      setDevices(devicesRes);
      setEnergySummary(energyRes);
      setEvents(eventsRes);

      // In HTTP mode only (VITE_DATA_MODE=http):
      // Set the Pi-connected timestamp when dashboard receives data from backend:
      // any event, sensor reading or device record with source === 'PI' and timestamp within last 60s.
      // Heartbeats alone must NOT count; only a sensor or vision reading counts.
      // In mock mode, this path must never run.
      if (isRealBackendMode) {
        const hasRecentPiEvent = eventsRes.some(
          (e) => e.source === 'PI' && isWithinLast60Seconds(e.timestamp)
        );
        const hasRecentPiDevice = devicesRes.some(
          (d) =>
            d.source === 'PI' &&
            d.type !== 'PI_GATEWAY' && // gateway heartbeats alone do not count
            (d.type === 'PI_CAMERA' || d.type.includes('PIR') || d.type.includes('SENSOR') || d.type.includes('TRANSFORMER')) &&
            isWithinLast60Seconds(d.lastPing)
        );
        const hasRecentPiRoom = roomsRes.some(
          (r) => r.source === 'PI' && (r.observedHeadcount > 0 || r.motionDetected)
        );

        if (hasRecentPiEvent || hasRecentPiDevice || hasRecentPiRoom) {
          recordPiReading();
        }
      }
    } catch (err) {
      console.error('Failed to load campus telemetry data:', err);
      if (isRealBackendMode) {
        setBackendOffline(true);
        // In HTTP mode, if the backend is unreachable: keep dataMode at SIMULATION and do not fall back silently to mock records
        setRooms([]);
        setAlerts([]);
        setDevices([]);
        setEvents([]);
        setDataMode('SIMULATION');
      } else {
        setError('Unable to synchronize telemetry gateway feeds.');
      }
    } finally {
      setLoading(false);
    }
  }, [recordPiReading]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Global keyboard shortcut for Cmd/Ctrl + K command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // dataMode becomes 'PI CONNECTED' only when a real reading with source 'PI' has arrived in the last 60 seconds, and reverts to 'SIMULATION' otherwise.
  useEffect(() => {
    const checkMode = () => {
      if (devModeOverride !== null) {
        setDataMode(devModeOverride);
        return;
      }
      if (isRealBackendMode && backendOffline) {
        setDataMode('SIMULATION');
        return;
      }
      if (lastPiReadingTime && Date.now() - lastPiReadingTime < 60000) {
        setDataMode('PI CONNECTED');
      } else {
        setDataMode('SIMULATION');
      }
    };
    checkMode();
    const interval = setInterval(checkMode, 1000);
    return () => clearInterval(interval);
  }, [lastPiReadingTime, devModeOverride, backendOffline]);

  const toggleDataMode = () => {
    setDevModeOverride((prev) => {
      const current = prev !== null ? prev : dataMode;
      return current === 'PI CONNECTED' ? 'SIMULATION' : 'PI CONNECTED';
    });
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  const switchRole = (role: UserRole) => {
    setCurrentUser(defaultUserProfiles[role]);
  };

  const acknowledgeAlert = async (id: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: 'ACKNOWLEDGED',
              triageStatus: 'Acknowledged',
              acknowledged: true,
            }
          : a
      )
    );
    await api.acknowledgeAlert(id);
  };

  const resolveAlert = async (id: string, note?: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: 'RESOLVED',
              triageStatus: 'Resolved',
            }
          : a
      )
    );
    await api.resolveAlert(id, note);
  };

  const assignAlert = async (id: string, assignee: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              assignee,
              status: 'ACTIVE',
              triageStatus: 'In progress',
            }
          : a
      )
    );
    await api.assignAlert(id, assignee);
  };

  const bulkUpdateAlerts = async (
    ids: string[],
    action: 'Acknowledge' | 'Resolve' | 'Assign',
    assignee?: string,
    note?: string
  ) => {
    setAlerts((prev) =>
      prev.map((a) => {
        if (!ids.includes(a.id)) return a;
        if (action === 'Acknowledge') {
          return {
            ...a,
            status: 'ACKNOWLEDGED',
            triageStatus: 'Acknowledged',
            acknowledged: true,
          };
        } else if (action === 'Resolve') {
          return {
            ...a,
            status: 'RESOLVED',
            triageStatus: 'Resolved',
          };
        } else if (action === 'Assign') {
          return {
            ...a,
            assignee: assignee || 'Facilities Desk',
            status: 'ACTIVE',
            triageStatus: 'In progress',
          };
        }
        return a;
      })
    );
    await api.bulkUpdateAlerts(ids, action, assignee, note);
  };

  const restoreAlertsSnapshot = (snapshot: Alert[]) => {
    setAlerts(snapshot);
  };

  const createEmergency = async (req: {
    requesterName: string;
    requesterRole: 'Student' | 'Faculty' | 'Staff' | 'Admin / HOD';
    locationRoomId: string;
    locationDetail: string;
    type: 'MEDICAL' | 'PERIMETER' | 'INFRASTRUCTURE' | 'FIRE_HAZARD';
    notes: string;
  }) => {
    const result = await api.createEmergency(req);
    // Refresh alerts to reflect newly triggered dispatch
    const updatedAlerts = await api.getAlerts();
    setAlerts(updatedAlerts);
    return result;
  };

  const runScenario = async (scenarioId: string) => {
    setActiveScenarioId(scenarioId);
    setIsSimulationMode(true);
    setLoading(true);
    try {
      await api.runScenario(scenarioId);
      await loadAllData();
    } catch (err) {
      console.warn('Scenario run not implemented or failed (501):', err);
      setLoading(false);
    }
  };

  const activeAlertCount = alerts.filter((a) => a.status === 'ACTIVE').length;

  return (
    <CampusContext.Provider
      value={{
        rooms,
        alerts,
        devices,
        energySummary,
        events,
        loading,
        error,
        dataMode,
        setDataMode,
        toggleDataMode,
        recordPiReading,
        isDevMode,
        connectionStatus,
        reconnectConnection,
        currentUser,
        switchRole,
        activeAlertCount,
        refreshData: loadAllData,
        acknowledgeAlert,
        resolveAlert,
        assignAlert,
        bulkUpdateAlerts,
        restoreAlertsSnapshot,
        createEmergency,
        runScenario,
        isSimulationMode,
        toggleSimulationMode,
        setSimulationMode,
        updateRoomLive,
        activeScenarioId,
        setActiveScenarioId,
        isDeviceOfflineSimulated,
        setIsDeviceOfflineSimulated,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        toggleSidebar,
        backendOffline,
        noticeboardEvents,
        addNoticeboardEvent,
        removeNoticeboardEvent,
        toggleNoticeboardEventApproval,
      }}
    >
      {children}
    </CampusContext.Provider>
  );
};

export const useCampus = (): CampusContextType => {
  const context = useContext(CampusContext);
  if (!context) {
    throw new Error('useCampus must be used within a CampusProvider');
  }
  return context;
};

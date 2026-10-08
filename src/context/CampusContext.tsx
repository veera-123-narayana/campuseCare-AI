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
import { api, isRealBackendMode } from '../services/api';
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

export const CampusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [devices, setDevices] = useState<EdgeDevice[]>([]);
  const [energySummary, setEnergySummary] = useState<EnergySummary | null>(null);
  const [events, setEvents] = useState<CampusEvent[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dataMode, setDataMode] = useState<DataMode>('PI CONNECTED');
  const [currentUser, setCurrentUser] = useState<UserProfile>(defaultUserProfiles['Admin / HOD']);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isSimulationMode, setIsSimulationMode] = useState<boolean>(true);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [isDeviceOfflineSimulated, setIsDeviceOfflineSimulated] = useState<boolean>(false);

  // Live WebSocket event integration with backoff and graceful offline preservation
  const handleLiveEvent = useCallback((event: import('../types/contract').LiveEventPayload) => {
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
    } catch (err) {
      console.error('Failed to load campus telemetry data:', err);
      setError('Unable to synchronize telemetry gateway feeds.');
    } finally {
      setLoading(false);
    }
  }, []);

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

  const toggleDataMode = () => {
    setDataMode((prev) => (prev === 'PI CONNECTED' ? 'SIMULATION' : 'PI CONNECTED'));
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
    await api.runScenario(scenarioId);
    await loadAllData();
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

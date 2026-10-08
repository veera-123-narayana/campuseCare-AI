export type DataSourceType = 'LIVE' | 'PI' | 'SIMULATED';

export type SensorSource = 'PI' | 'SIMULATION' | 'ESP32' | 'LIVE' | 'SIMULATED';

export type PriorityLevel = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';

export type OperationalStatus = 'normal' | 'attention' | 'review' | 'critical' | 'inactive';

export type ClassState =
  | 'ACTIVE_CONFIRMED'
  | 'UNCONFIRMED_ACTIVITY'
  | 'VACANT_SETBACK'
  | 'UNSCHEDULED_OCCUPIED'
  | 'DISPATCH_ALERT';

export type UserRole = 'Admin / HOD' | 'Faculty' | 'Student';

export interface UserProfile {
  name: string;
  role: UserRole;
  department: string;
  avatarInitials: string;
}

export interface MetricItem {
  id: string;
  label: string;
  value: string | number;
  unit?: string;
  delta?: {
    value: string;
    trend: 'up' | 'down' | 'neutral';
    isPositive?: boolean;
  };
  source: DataSourceType;
  subtext?: string;
}

export interface TimetableEntry {
  id: string;
  roomId: string;
  subject: string;
  code: string;
  section: string;
  faculty: string;
  timeSlot: string;
  startTime: string;
  endTime: string;
  day: string;
  expectedStudents: number;
  isCurrent: boolean;
  note?: string; // "demo data"
}

export interface Room {
  id: string;
  number: string;
  name: string;
  block: 'CSE Block' | 'Main Block';
  floor: string;
  capacity: number;
  currentClass?: string;
  classCode?: string;
  section?: string;
  faculty?: string;
  classTime?: string;
  status: OperationalStatus;
  priority: PriorityLevel;
  hvacStatus: 'ON' | 'OFF' | 'SETBACK';
  lightStatus: 'ON' | 'OFF' | 'DIM';
  expectedOccupancy: number;
  observedHeadcount: number;
  motionDetected: boolean;
  energyKw: number;
  source: DataSourceType;
  classState: ClassState;
  note: string; // "demo data"
}

export interface OccupancyReading {
  id: string;
  roomId: string;
  expected: number;
  observed: number;
  confidence: number;
  source: DataSourceType;
  timestamp: string;
  note?: string; // "demo data"
}

export interface SensorReading {
  deviceId: string;
  source: SensorSource;
  roomId: string;
  type: 'PIR_MOTION' | 'CAMERA_HEADCOUNT' | 'POWER_CURRENT' | 'TEMPERATURE' | 'DOOR_CONTACT';
  value: number | string | boolean;
  unit: string;
  timestamp: string;
  note?: string; // "demo data"
}

export interface CampusEvent {
  id: string;
  type: string;
  source: SensorSource;
  roomId: string;
  priority: PriorityLevel;
  confidence: number;
  explanation: string;
  recommendedAction: string;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
  timestamp: string;
  actor?: string;
  note?: string; // "demo data"
}

export type AlertStatus = 'New' | 'Acknowledged' | 'In progress' | 'Resolved';

export type AlertSourceCategory = 'Vision' | 'IoT' | 'Timetable' | 'User';

export interface AlertHistoryEntry {
  id: string;
  timestamp: string;
  status: AlertStatus;
  actor: string;
  note?: string;
}

export interface Alert {
  id: string;
  roomId: string;
  roomName: string;
  roomNumber?: string;
  block: string;
  building?: string;
  title: string;
  description: string;
  expectedState: string;
  observedState: string;
  timeWindow?: string;
  gracePeriodMinutes: number;
  priority: PriorityLevel;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | AlertStatus;
  triageStatus?: AlertStatus;
  source: DataSourceType;
  sourceCategory?: AlertSourceCategory;
  timestamp: string;
  age?: string;
  energyImpactKw: number;
  acknowledged?: boolean;
  assignee?: string;
  repeatCount?: number;
  repeatWindow?: string;
  contextSnapshot?: {
    occupancyObserved: number;
    occupancyExpected: number;
    temperature: number;
    powerKw: number;
    timeSlot: string;
  };
  history?: AlertHistoryEntry[];
  note: string; // "demo data"
}

// Backward compatibility alias for OperationalAlert
export type OperationalAlert = Alert;

export interface EdgeDevice {
  id: string;
  deviceId: string;
  name: string;
  type: 'PI_CAMERA' | 'PI_GATEWAY' | 'ESP32_PIR' | 'CURRENT_TRANSFORMER';
  roomId: string;
  status: 'ONLINE' | 'OFFLINE' | 'DEGRADED';
  ipAddress: string;
  lastPing: string;
  firmwareVersion: string;
  source: SensorSource;
  note?: string; // "demo data"
}

export interface EmergencyRequest {
  id: string;
  requesterName: string;
  requesterRole: 'Student' | 'Faculty' | 'Staff' | 'Admin / HOD';
  locationRoomId: string;
  locationDetail: string;
  type: 'MEDICAL' | 'PERIMETER' | 'INFRASTRUCTURE' | 'FIRE_HAZARD';
  priority: 'RED';
  status: 'DISPATCHED' | 'EN_ROUTE' | 'RESOLVED';
  timestamp: string;
  notes: string;
  source: DataSourceType;
  note: string; // "demo data"
}

export interface EnergyHourlyPoint {
  time: string;
  actualKw: number;
  baselineKw: number;
  unoccupiedWasteKw: number;
  source: DataSourceType;
}

export interface FloorRoomNode {
  id: string;
  number: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  status: OperationalStatus;
  priority: PriorityLevel;
  observedOccupancy: number;
  expectedOccupancy: number;
  capacity: number;
  temperature: number;
  energyKw: number;
  hvacStatus: 'ON' | 'OFF' | 'SETBACK';
  currentClass?: string;
  source: DataSourceType;
}

export interface EnergySummary {
  totalKw: number;
  baselineKw: number;
  dailyKwh: number;
  estimatedWasteKwh: number;
  co2KgSaved: number;
  sdgTargetAchievedPercent: number;
  unoccupiedWasteKw: number;
  source: DataSourceType;
  note: string; // "demo data"
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  detail: string;
  status: OperationalStatus;
  source: DataSourceType;
  actor?: string;
  note?: string; // "demo data"
}

export interface RoomRecord {
  id: string;
  roomCode: string;
  floor: string;
  department: string;
  capacity: number;
  expectedOccupancy: number;
  observedOccupancy: number;
  motionDetected: boolean;
  hvacPowerKw: number;
  lightingStatus: 'ON' | 'OFF' | 'DIM';
  status: OperationalStatus;
  source: DataSourceType;
  lastUpdated: string;
  note?: string; // "demo data"
}

export interface AssistantToolCall {
  id: string;
  tool: string;
  resultSummary: string;
  recordsCount: number;
  source: DataSourceType;
  records?: Array<{
    id: string;
    title: string;
    subtitle?: string;
    category?: string;
    badge?: string;
    status?: string;
    metrics?: Record<string, string | number>;
    link?: string;
  }>;
}

export interface AssistantSourceRecord {
  id: string;
  title: string;
  subtitle?: string;
  category: 'Room' | 'Alert' | 'Device' | 'Timetable' | 'Energy' | 'Sensor';
  source: DataSourceType;
  details?: string;
  link?: string;
  badge?: string;
  status?: string;
  metrics?: Record<string, string | number>;
}

export interface AssistantResponse {
  answer: string;
  toolCalls: AssistantToolCall[];
  sourceRecords: AssistantSourceRecord[];
  suggestedActions: string[];
  relevantRooms: string[];
  source: DataSourceType;
  degradedMode?: boolean;
  note: string;
}

// Re-export contract types
export * from './contract';


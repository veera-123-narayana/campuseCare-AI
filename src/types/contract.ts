/**
 * @file types/contract.ts
 * REST API Contract TypeScript definitions matching docs/API.md
 * Strictly exports types for all endpoints:
 * GET /api/rooms
 * GET /api/classrooms/status
 * GET /api/alerts
 * PATCH /api/alerts/:id
 * POST /api/vision/events
 * POST /api/edge/sensors
 * POST /api/edge/heartbeat
 * POST /api/emergency
 * POST /api/ai/ask
 */

import {
  Alert,
  AlertStatus,
  AssistantResponse,
  DataSourceType,
  EdgeDevice,
  OperationalStatus,
  PriorityLevel,
  Room,
  SensorReading,
  SensorSource,
} from './index';

// 1. GET /api/rooms
export interface GetRoomsParams {
  block?: string;
}

export interface GetRoomsResponse {
  data: Room[];
  total: number;
  timestamp: string;
}

// 2. GET /api/classrooms/status
export interface ClassroomStatusItem {
  roomId: string;
  roomNumber: string;
  name: string;
  block: string;
  floor: string;
  status: OperationalStatus;
  priority: PriorityLevel;
  classState: string;
  expectedOccupancy: number;
  observedHeadcount: number;
  currentClass?: string;
  timeSlot?: string;
  powerKw: number;
  source: DataSourceType;
  gracePeriodRemainingSec?: number;
}

export interface GetClassroomsStatusResponse {
  classrooms: ClassroomStatusItem[];
  timestamp: string;
}

// 3. GET /api/alerts
export interface GetAlertsParams {
  priority?: PriorityLevel;
  status?: AlertStatus | 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
}

export interface GetAlertsResponse {
  data: Alert[];
  count: number;
}

// 4. PATCH /api/alerts/:id
export interface PatchAlertRequest {
  action?: 'Acknowledge' | 'Resolve' | 'Assign';
  status?: AlertStatus;
  assignee?: string;
  note?: string;
}

export interface PatchAlertResponse {
  success: boolean;
  alert: Alert;
}

// 5. POST /api/vision/events
export interface VisionEventRequest {
  deviceId: string;
  roomId: string;
  observedHeadcount: number;
  confidence: number;
  inferenceTimeMs?: number;
  timestamp?: string;
}

export interface VisionEventResponse {
  status: 'recorded' | 'processed';
  eventId: string;
  stateReconciled: boolean;
}

// 6. POST /api/edge/sensors
export interface EdgeSensorTelemetryRequest {
  deviceId: string;
  roomId: string;
  type: 'PIR_MOTION' | 'CAMERA_HEADCOUNT' | 'POWER_CURRENT' | 'TEMPERATURE' | 'DOOR_CONTACT';
  value: number | string | boolean;
  unit: string;
  source?: SensorSource;
  timestamp?: string;
}

export interface EdgeSensorTelemetryResponse {
  status: 'ok';
  readingId: string;
}

// 7. POST /api/edge/heartbeat
export interface EdgeHeartbeatRequest {
  deviceId: string;
  roomId?: string;
  firmwareVersion?: string;
  status?: 'ONLINE' | 'OFFLINE' | 'DEGRADED';
  ipAddress?: string;
  uptimeSec?: number;
  timestamp?: string;
}

export interface EdgeHeartbeatResponse {
  status: 'pong';
  receivedAt: string;
}

// 8. POST /api/emergency
export interface CreateEmergencyRequest {
  type: 'Medical' | 'Security' | 'Fire' | 'Accident' | 'Other' | 'MEDICAL' | 'PERIMETER' | 'INFRASTRUCTURE' | 'FIRE_HAZARD';
  building?: string;
  floor?: string;
  room?: string;
  locationRoomId?: string;
  locationDetail?: string;
  description?: string;
  notes?: string;
  requesterName: string;
  requesterRole: 'Student' | 'Faculty' | 'Staff' | 'Admin / HOD';
}

export interface CreateEmergencyResponse {
  id: string;
  status: string;
  priority: 'RED';
  timestamp: string;
  assignedTeam?: string;
}

// 9. POST /api/ai/ask
export interface AskAiAssistantRequest {
  query: string;
  degradedMode?: boolean;
}

export type AskAiAssistantResponse = AssistantResponse;

// 10. WebSocket Live Events
export type LiveEventPayload =
  | { type: 'alert.created'; alert: Alert }
  | { type: 'alert.updated'; alert: Alert }
  | { type: 'room.updated'; roomId: string; updates: Partial<Room> }
  | { type: 'vision.headcount'; roomId: string; observedHeadcount: number; timestamp: string }
  | { type: 'sensor.reading'; reading: SensorReading }
  | { type: 'edge.heartbeat'; deviceId: string; status: 'ONLINE' | 'OFFLINE' | 'DEGRADED'; timestamp: string }
  | { type: 'emergency.dispatched'; id: string; location: string; emergencyType: string };

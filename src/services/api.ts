/**
 * @file services/api.ts
 * Single source of truth for CAMPUSCARE data layer.
 * Fully typed, async with 300-600ms simulated network latency.
 * All mock data strictly carries `note: "demo data"` and explicit data-source badges.
 */

import {
  Alert,
  CampusEvent,
  DataSourceType,
  EdgeDevice,
  EmergencyRequest,
  EnergySummary,
  MetricItem,
  OccupancyReading,
  PriorityLevel,
  Room,
  RoomRecord,
  SensorReading,
  TimetableEntry,
  TimelineEvent,
  AssistantToolCall,
  AssistantSourceRecord,
  AssistantResponse,
  AlertStatus,
  ClassroomStatusItem,
  VisionEventRequest,
  VisionEventResponse,
  EdgeSensorTelemetryRequest,
  EdgeSensorTelemetryResponse,
  EdgeHeartbeatRequest,
  EdgeHeartbeatResponse,
} from '../types';

export interface ApiClient {
  getRooms(blockFilter?: string): Promise<Room[]>;
  getRoom(roomId: string): Promise<Room | null>;
  getClassroomStatus(): Promise<ClassroomStatusItem[]>;
  getTimetable(roomId?: string): Promise<TimetableEntry[]>;
  getOccupancy(roomId?: string): Promise<OccupancyReading[]>;
  getSensors(roomId?: string): Promise<SensorReading[]>;
  getEvents(): Promise<CampusEvent[]>;
  getAlerts(priorityFilter?: PriorityLevel): Promise<Alert[]>;
  acknowledgeAlert(id: string): Promise<{ success: boolean; alert: Alert }>;
  resolveAlert(id: string, note?: string): Promise<{ success: boolean; alert: Alert }>;
  assignAlert(id: string, assignee: string): Promise<{ success: boolean; alert: Alert }>;
  updateAlertStatus(id: string, status: AlertStatus, note?: string): Promise<{ success: boolean; alert: Alert }>;
  bulkUpdateAlerts(
    ids: string[],
    action: 'Acknowledge' | 'Resolve' | 'Assign',
    assignee?: string,
    note?: string
  ): Promise<{ success: boolean; alerts: Alert[] }>;
  getDevices(): Promise<EdgeDevice[]>;
  createEmergency(request: {
    requesterName: string;
    requesterRole: 'Student' | 'Faculty' | 'Staff' | 'Admin / HOD';
    locationRoomId: string;
    locationDetail: string;
    type: 'MEDICAL' | 'PERIMETER' | 'INFRASTRUCTURE' | 'FIRE_HAZARD';
    notes: string;
  }): Promise<EmergencyRequest>;
  getEnergySummary(): Promise<EnergySummary>;
  askAssistant(
    query: string,
    options?: { degradedMode?: boolean }
  ): Promise<AssistantResponse>;
  runScenario(scenarioId: string): Promise<{
    name: string;
    description: string;
    affectedRooms: Room[];
    note: string;
  }>;
  getSpecimenData(): Promise<DesignSpecimenData>;
  getHourlyEnergy(timeframe?: 'Today' | 'Week'): Promise<import('../types').EnergyHourlyPoint[]>;
  getFloorPlanNodes(): Promise<import('../types').FloorRoomNode[]>;

  // REST Contract explicit handlers
  postVisionEvent?(event: VisionEventRequest): Promise<VisionEventResponse>;
  postEdgeSensor?(reading: EdgeSensorTelemetryRequest): Promise<EdgeSensorTelemetryResponse>;
  postEdgeHeartbeat?(heartbeat: EdgeHeartbeatRequest): Promise<EdgeHeartbeatResponse>;
}

export interface DesignSpecimenData {
  metrics: MetricItem[];
  alerts: Alert[];
  timeline: TimelineEvent[];
  rooms: RoomRecord[];
  systemHealth: {
    connectedNodes: number;
    piNodesActive: number;
    edgeSensorsOnline: number;
    ingestRateSec: number;
    lastHeartbeat: string;
    source: DataSourceType;
  };
}

// Helper for 300-600ms fake latency
const latency = <T>(data: T): Promise<T> => {
  const ms = Math.floor(300 + Math.random() * 300);
  return new Promise((resolve) => setTimeout(() => resolve(structuredClone(data)), ms));
};

// State container for mutable in-memory mock store
let roomsStore: Room[] = [
  {
    id: 'room-101',
    number: '101',
    name: 'Lecture Hall 101',
    block: 'Main Block',
    floor: 'Level 1',
    capacity: 75,
    status: 'inactive',
    priority: 'GREEN',
    hvacStatus: 'OFF',
    lightStatus: 'OFF',
    expectedOccupancy: 0,
    observedHeadcount: 0,
    motionDetected: false,
    energyKw: 0.1,
    source: 'SIMULATED',
    classState: 'VACANT_SETBACK',
    note: 'demo data',
  },
  {
    id: 'room-102',
    number: '102',
    name: 'Seminar Room 102',
    block: 'Main Block',
    floor: 'Level 1',
    capacity: 45,
    status: 'attention',
    priority: 'YELLOW',
    hvacStatus: 'ON',
    lightStatus: 'ON',
    expectedOccupancy: 0,
    observedHeadcount: 0,
    motionDetected: false,
    energyKw: 1.8,
    source: 'SIMULATED',
    classState: 'UNSCHEDULED_OCCUPIED',
    note: 'demo data',
  },
  {
    id: 'room-201',
    number: '201',
    name: 'Smart Classroom 201',
    block: 'CSE Block',
    floor: 'Level 2',
    capacity: 55,
    currentClass: 'Data Structures & Algorithms',
    classCode: 'CS-201',
    section: 'CSE-B',
    faculty: 'Dr. Ramesh Kumar',
    classTime: '09:00 - 10:00',
    status: 'normal',
    priority: 'GREEN',
    hvacStatus: 'ON',
    lightStatus: 'ON',
    expectedOccupancy: 50,
    observedHeadcount: 48,
    motionDetected: true,
    energyKw: 2.2,
    source: 'SIMULATED',
    classState: 'ACTIVE_CONFIRMED',
    note: 'demo data',
  },
  {
    id: 'room-202',
    number: '202',
    name: 'Interactive Studio 202',
    block: 'CSE Block',
    floor: 'Level 2',
    capacity: 50,
    currentClass: 'Computer Networks',
    classCode: 'CS-302',
    section: 'CSE-C',
    faculty: 'Prof. Ananya Sen',
    classTime: '10:00 - 11:00',
    status: 'normal',
    priority: 'GREEN',
    hvacStatus: 'ON',
    lightStatus: 'ON',
    expectedOccupancy: 45,
    observedHeadcount: 42,
    motionDetected: true,
    energyKw: 2.1,
    source: 'SIMULATED',
    classState: 'ACTIVE_CONFIRMED',
    note: 'demo data',
  },
  {
    id: 'room-204',
    number: '204',
    name: 'Lecture Theatre 204',
    block: 'CSE Block',
    floor: 'Level 2',
    capacity: 60,
    currentClass: 'Artificial Intelligence',
    classCode: 'AI-401',
    section: 'CSE-A',
    faculty: 'Dr. Suresh Varma',
    classTime: '10:00 - 11:00',
    status: 'review',
    priority: 'ORANGE',
    hvacStatus: 'ON',
    lightStatus: 'ON',
    expectedOccupancy: 60,
    observedHeadcount: 0,
    motionDetected: false,
    energyKw: 3.4,
    source: 'SIMULATED',
    classState: 'UNCONFIRMED_ACTIVITY',
    note: 'demo data',
  },
  {
    id: 'room-301',
    number: '301',
    name: 'Research Seminar 301',
    block: 'Main Block',
    floor: 'Level 3',
    capacity: 35,
    status: 'inactive',
    priority: 'GREEN',
    hvacStatus: 'SETBACK',
    lightStatus: 'OFF',
    expectedOccupancy: 0,
    observedHeadcount: 0,
    motionDetected: false,
    energyKw: 0.3,
    source: 'SIMULATED',
    classState: 'VACANT_SETBACK',
    note: 'demo data',
  },
  {
    id: 'room-lab-ai-01',
    number: 'LAB-AI-01',
    name: 'AI & Robotics Hub 01',
    block: 'CSE Block',
    floor: 'Ground',
    capacity: 40,
    status: 'critical',
    priority: 'RED',
    hvacStatus: 'ON',
    lightStatus: 'DIM',
    expectedOccupancy: 0,
    observedHeadcount: 1,
    motionDetected: true,
    energyKw: 4.8,
    source: 'SIMULATED',
    classState: 'DISPATCH_ALERT',
    note: 'demo data',
  },
  {
    id: 'room-lab-ai-02',
    number: 'LAB-AI-02',
    name: 'Computer Vision Testbed 02',
    block: 'CSE Block',
    floor: 'Ground',
    capacity: 30,
    currentClass: 'Edge Machine Learning Practicum',
    classCode: 'AI-490',
    section: 'CSE-A',
    faculty: 'Dr. Malini Rao',
    classTime: '09:30 - 11:30',
    status: 'normal',
    priority: 'GREEN',
    hvacStatus: 'ON',
    lightStatus: 'ON',
    expectedOccupancy: 28,
    observedHeadcount: 26,
    motionDetected: true,
    energyKw: 3.2,
    source: 'SIMULATED',
    classState: 'ACTIVE_CONFIRMED',
    note: 'demo data',
  },
];

let timetableStore: TimetableEntry[] = [
  {
    id: 'tt-204-1',
    roomId: 'room-204',
    subject: 'Artificial Intelligence',
    code: 'AI-401',
    section: 'CSE-A',
    faculty: 'Dr. Suresh Varma',
    timeSlot: '10:00 - 11:00',
    startTime: '10:00',
    endTime: '11:00',
    day: 'Wednesday',
    expectedStudents: 60,
    isCurrent: true,
    note: 'demo data',
  },
  {
    id: 'tt-201-1',
    roomId: 'room-201',
    subject: 'Data Structures & Algorithms',
    code: 'CS-201',
    section: 'CSE-B',
    faculty: 'Dr. Ramesh Kumar',
    timeSlot: '09:00 - 10:00',
    startTime: '09:00',
    endTime: '10:00',
    day: 'Wednesday',
    expectedStudents: 50,
    isCurrent: false,
    note: 'demo data',
  },
  {
    id: 'tt-202-1',
    roomId: 'room-202',
    subject: 'Computer Networks',
    code: 'CS-302',
    section: 'CSE-C',
    faculty: 'Prof. Ananya Sen',
    timeSlot: '10:00 - 11:00',
    startTime: '10:00',
    endTime: '11:00',
    day: 'Wednesday',
    expectedStudents: 45,
    isCurrent: true,
    note: 'demo data',
  },
  {
    id: 'tt-lab-02',
    roomId: 'room-lab-ai-02',
    subject: 'Edge Machine Learning Practicum',
    code: 'AI-490',
    section: 'CSE-A',
    faculty: 'Dr. Malini Rao',
    timeSlot: '09:30 - 11:30',
    startTime: '09:30',
    endTime: '11:30',
    day: 'Wednesday',
    expectedStudents: 28,
    isCurrent: true,
    note: 'demo data',
  },
];

let alertsStore: Alert[] = [
  {
    id: 'ALT-204',
    roomId: 'room-204',
    roomName: 'Lecture Hall 204',
    roomNumber: 'LH-204',
    block: 'CSE Block',
    building: 'CSE Block Level 2',
    title: 'Classroom activity not confirmed',
    description:
      'Timetable registers Artificial Intelligence (CSE-A, 10:00-11:00, capacity 60). Camera headcount reads 0 and IR / motion sensor registers no activity past the 15-minute grace threshold. High-bay lights and HVAC remain energized at 3.4 kW.',
    expectedState: 'Artificial Intelligence · 60 seats expected',
    observedState: 'Headcount 0 · IR motion idle · 3.4 kW',
    timeWindow: '10:00 - 11:00',
    gracePeriodMinutes: 10,
    priority: 'ORANGE',
    status: 'ACTIVE',
    triageStatus: 'New',
    source: 'SIMULATED',
    sourceCategory: 'Vision',
    timestamp: '10:18:22',
    age: '4m ago',
    energyImpactKw: 3.4,
    assignee: 'Unassigned',
    repeatCount: 3,
    repeatWindow: 'in 20 min',
    contextSnapshot: {
      occupancyObserved: 0,
      occupancyExpected: 60,
      temperature: 28.4,
      powerKw: 3.4,
      timeSlot: '10:00 - 11:00',
    },
    history: [
      {
        id: 'h-204-1',
        timestamp: '10:10:00',
        status: 'New',
        actor: 'Commencement Grace Engine',
        note: 'Configured 10-minute grace window elapsed with zero headcount confirmation.',
      },
      {
        id: 'h-204-2',
        timestamp: '10:14:10',
        status: 'New',
        actor: 'Vision Inference Cluster',
        note: 'Automated re-sampling cycle #2 confirmed headcount remaining at 0.',
      },
      {
        id: 'h-204-3',
        timestamp: '10:18:22',
        status: 'New',
        actor: 'Sub-Meter Telemetry Node',
        note: 'Branch circuits drawing 3.4 kW continuous load with zero occupant presence.',
      },
    ],
    note: 'demo data',
  },
  {
    id: 'ALT-LAB-01',
    roomId: 'room-lab-ai-01',
    roomName: 'AI & Robotics Hub 01',
    roomNumber: 'LAB-AI-01',
    block: 'CSE Block',
    building: 'CSE Block Ground',
    title: 'Emergency perimeter hardware alert',
    description:
      'Secondary egress door magnetic contact interrupted outside scheduled lab hours. IR / motion sensor detected localized motion near server rack.',
    expectedState: 'Secured Perimeter / Access Card Controlled',
    observedState: 'Door contact open · 1 person detected',
    timeWindow: 'Access Controlled',
    gracePeriodMinutes: 0,
    priority: 'RED',
    status: 'ACTIVE',
    triageStatus: 'New',
    source: 'SIMULATED',
    sourceCategory: 'IoT',
    timestamp: '10:14:15',
    age: '14m ago',
    energyImpactKw: 0,
    assignee: 'Security Patrol #04',
    repeatCount: 2,
    repeatWindow: 'in 10 min',
    contextSnapshot: {
      occupancyObserved: 1,
      occupancyExpected: 0,
      temperature: 22.0,
      powerKw: 0.1,
      timeSlot: 'Access Controlled',
    },
    history: [
      {
        id: 'h-lab-1',
        timestamp: '10:14:15',
        status: 'New',
        actor: 'Perimeter Sensor Mesh',
        note: 'Secondary egress reed switch opened without authorization badge scan.',
      },
      {
        id: 'h-lab-2',
        timestamp: '10:15:00',
        status: 'New',
        actor: 'Duty Desk Operator',
        note: 'Automated critical dispatch alert triggered to Campus Security Patrol #04.',
      },
    ],
    note: 'demo data',
  },
  {
    id: 'ALT-102',
    roomId: 'room-102',
    roomName: 'Seminar Room 102',
    roomNumber: 'SR-102',
    block: 'Main Block',
    building: 'Main Block Level 1',
    title: 'Unscheduled electrical load registered',
    description:
      'Room has no active booking in timetable database. Smart sub-meter registers lighting circuit active at 1.8 kW.',
    expectedState: 'Unscheduled / Vacant',
    observedState: 'Headcount 0 · Load 1.8 kW active',
    timeWindow: 'Unscheduled Window',
    gracePeriodMinutes: 10,
    priority: 'YELLOW',
    status: 'ACKNOWLEDGED',
    triageStatus: 'Acknowledged',
    source: 'SIMULATED',
    sourceCategory: 'IoT',
    timestamp: '10:05:40',
    age: '28m ago',
    energyImpactKw: 1.8,
    assignee: 'Facilities Desk',
    contextSnapshot: {
      occupancyObserved: 0,
      occupancyExpected: 0,
      temperature: 24.1,
      powerKw: 1.8,
      timeSlot: 'Unscheduled',
    },
    history: [
      {
        id: 'h-102-1',
        timestamp: '10:05:40',
        status: 'New',
        actor: 'Branch CT Sub-Meter',
        note: 'Lighting relay active outside scheduled booking window (1.8 kW draw).',
      },
      {
        id: 'h-102-2',
        timestamp: '10:09:12',
        status: 'Acknowledged',
        actor: 'Dr. Aris Vance (Admin)',
        note: 'Facilities staff notified to verify room switch status.',
      },
    ],
    note: 'demo data',
  },
  {
    id: 'ALT-301',
    roomId: 'room-301',
    roomName: 'Research Seminar 301',
    roomNumber: 'RS-301',
    block: 'Main Block',
    building: 'Main Block Level 3',
    title: 'Automated setback verification pending',
    description:
      'Afternoon research seminar cancelled in registrar database. Setback verification protocol queued for FCU climate zones.',
    expectedState: 'Recess / Cancelled Slot',
    observedState: 'Headcount 0 · Circuit idle at 0.3 kW',
    timeWindow: '11:00 - 12:30',
    gracePeriodMinutes: 15,
    priority: 'YELLOW',
    status: 'ACTIVE',
    triageStatus: 'In progress',
    source: 'SIMULATED',
    sourceCategory: 'Timetable',
    timestamp: '09:48:00',
    age: '45m ago',
    energyImpactKw: 0.3,
    assignee: 'Facilities Desk',
    contextSnapshot: {
      occupancyObserved: 0,
      occupancyExpected: 0,
      temperature: 23.0,
      powerKw: 0.3,
      timeSlot: '11:00 - 12:30',
    },
    history: [
      {
        id: 'h-301-1',
        timestamp: '09:40:00',
        status: 'New',
        actor: 'Registrar Sync Service',
        note: 'Timetable booking cancelled by Department Office.',
      },
      {
        id: 'h-301-2',
        timestamp: '09:48:00',
        status: 'In progress',
        actor: 'Facilities Desk',
        note: 'Initiating setback protocol verification on zone FCU.',
      },
    ],
    note: 'demo data',
  },
  {
    id: 'ALT-202',
    roomId: 'room-202',
    roomName: 'Interactive Studio 202',
    roomNumber: 'ST-202',
    block: 'CSE Block',
    building: 'CSE Block Level 2',
    title: 'Capacity variance exceeds tolerance',
    description:
      'Computer Networks session scheduled for 45 students. Vision sensor registers 42 students (nominal variance within acceptable bounds).',
    expectedState: 'CS-302 (45 expected)',
    observedState: 'Headcount 42 · Stable',
    timeWindow: '10:00 - 11:00',
    gracePeriodMinutes: 15,
    priority: 'YELLOW',
    status: 'ACTIVE',
    triageStatus: 'New',
    source: 'SIMULATED',
    sourceCategory: 'Vision',
    timestamp: '09:35:12',
    age: '52m ago',
    energyImpactKw: 0.0,
    assignee: 'Unassigned',
    contextSnapshot: {
      occupancyObserved: 42,
      occupancyExpected: 45,
      temperature: 23.4,
      powerKw: 2.1,
      timeSlot: '10:00 - 11:00',
    },
    history: [
      {
        id: 'h-202-1',
        timestamp: '09:35:12',
        status: 'New',
        actor: 'Edge Camera Model',
        note: 'Headcount 42 confirmed. Airflow maintained.',
      },
    ],
    note: 'demo data',
  },
  {
    id: 'ALT-EMG-101',
    roomId: 'room-egress-east',
    roomName: 'East Hallway Egress Door',
    roomNumber: 'EG-02',
    block: 'CSE Block',
    building: 'CSE Block Ground',
    title: 'Life-safety egress test discrepancy',
    description:
      'Student user report filed regarding stiff push-bar latch on secondary fire exit door near student cafeteria.',
    expectedState: 'Smooth free-egress actuation',
    observedState: 'Latch stiffness reported',
    timeWindow: 'Continuous 24/7',
    gracePeriodMinutes: 0,
    priority: 'RED',
    status: 'ACTIVE',
    triageStatus: 'In progress',
    source: 'SIMULATED',
    sourceCategory: 'User',
    timestamp: '09:14:15',
    age: '1h ago',
    energyImpactKw: 0.0,
    assignee: 'Campus Safety Chief',
    contextSnapshot: {
      occupancyObserved: 0,
      occupancyExpected: 0,
      temperature: 21.5,
      powerKw: 0.0,
      timeSlot: 'Continuous',
    },
    history: [
      {
        id: 'h-emg-1',
        timestamp: '09:14:15',
        status: 'New',
        actor: 'Aditya Sharma (Student)',
        note: 'Submitted rapid safety request via campus portal.',
      },
      {
        id: 'h-emg-2',
        timestamp: '09:20:00',
        status: 'In progress',
        actor: 'Campus Safety Chief',
        note: 'Maintenance technician dispatched with emergency lockset kit.',
      },
    ],
    note: 'demo data',
  },
  {
    id: 'ALT-201',
    roomId: 'room-201',
    roomName: 'Smart Classroom 201',
    roomNumber: 'CR-201',
    block: 'CSE Block',
    building: 'CSE Block Level 2',
    title: 'Optimal occupancy balance verified',
    description:
      'Timetable matches observed count (50 expected vs 48 observed). Automated airflow modulation engaged.',
    expectedState: 'CS-201 (50 expected)',
    observedState: 'Headcount 48 · Optimal',
    timeWindow: '09:00 - 10:00',
    gracePeriodMinutes: 15,
    priority: 'GREEN',
    status: 'RESOLVED',
    triageStatus: 'Resolved',
    source: 'SIMULATED',
    sourceCategory: 'Timetable',
    timestamp: '09:20:00',
    age: '2h ago',
    energyImpactKw: -0.8,
    assignee: 'Automated Engine',
    contextSnapshot: {
      occupancyObserved: 48,
      occupancyExpected: 50,
      temperature: 23.1,
      powerKw: 2.2,
      timeSlot: '09:00 - 10:00',
    },
    history: [
      {
        id: 'h-201-1',
        timestamp: '09:00:00',
        status: 'New',
        actor: 'Academic SIS Service',
        note: 'Timetable slot started.',
      },
      {
        id: 'h-201-2',
        timestamp: '09:20:00',
        status: 'Resolved',
        actor: 'Automated Engine',
        note: 'Attendance confirmed at 48/50. Energy setback not required.',
      },
    ],
    note: 'demo data',
  },
];

let devicesStore: EdgeDevice[] = [
  {
    id: 'dev-1',
    deviceId: 'PI-CAM-204',
    name: 'Camera node',
    type: 'PI_CAMERA',
    roomId: 'room-204',
    status: 'ONLINE',
    ipAddress: '--',
    lastPing: '2s ago',
    firmwareVersion: 'v2.4.1-edge',
    source: 'SIMULATED',
    note: 'demo data',
  },
  {
    id: 'dev-2',
    deviceId: 'ESP32-PIR-204',
    name: 'IR / motion sensor (GPIO17)',
    type: 'ESP32_PIR',
    roomId: 'room-204',
    status: 'ONLINE',
    ipAddress: '--',
    lastPing: '1s ago',
    firmwareVersion: 'v1.1.0-esp',
    source: 'SIMULATED',
    note: 'demo data',
  },
  {
    id: 'dev-3',
    deviceId: 'CT-SUB-204',
    name: 'CT power clamp',
    type: 'CURRENT_TRANSFORMER',
    roomId: 'room-204',
    status: 'NOT_INSTALLED',
    ipAddress: '--',
    lastPing: 'Not installed',
    firmwareVersion: 'v3.0.0-sim',
    source: 'SIMULATED',
    note: 'demo data',
  },
  {
    id: 'dev-4',
    deviceId: 'PI-GW-CSE-02',
    name: 'Raspberry Pi 4B (demo gateway)',
    type: 'PI_GATEWAY',
    roomId: 'room-202',
    status: 'ONLINE',
    ipAddress: '--',
    lastPing: '500ms ago',
    firmwareVersion: 'v4.1.2-gw',
    source: 'SIMULATED',
    note: 'demo data',
  },
  {
    id: 'dev-5',
    deviceId: 'ESP32-MAG-LAB01',
    name: 'Door contact',
    type: 'DOOR_CONTACT',
    roomId: 'room-lab-ai-01',
    status: 'NOT_INSTALLED',
    ipAddress: '--',
    lastPing: 'Not installed',
    firmwareVersion: 'v1.0.8',
    source: 'SIMULATED',
    note: 'demo data',
  },
  {
    id: 'dev-6',
    deviceId: 'IAQ-204',
    name: 'Air quality',
    type: 'AIR_QUALITY',
    roomId: 'room-204',
    status: 'NOT_INSTALLED',
    ipAddress: '--',
    lastPing: 'Not installed',
    firmwareVersion: 'v1.0.0-sim',
    source: 'SIMULATED',
    note: 'demo data',
  },
  {
    id: 'dev-7',
    deviceId: 'ARDUINO-UNO-01',
    name: 'Arduino Uno',
    type: 'PI_GATEWAY',
    roomId: 'room-204',
    status: 'OFFLINE',
    ipAddress: '--',
    lastPing: '--',
    firmwareVersion: '--',
    source: 'SIMULATED',
    note: 'demo data',
  },
  {
    id: 'dev-8',
    deviceId: 'ESP8266-01',
    name: 'ESP8266',
    type: 'PI_GATEWAY',
    roomId: 'room-204',
    status: 'OFFLINE',
    ipAddress: '--',
    lastPing: '--',
    firmwareVersion: '--',
    source: 'SIMULATED',
    note: 'demo data',
  },
];

let emergenciesStore: EmergencyRequest[] = [
  {
    id: 'EMG-101',
    requesterName: 'Aditya Sharma',
    requesterRole: 'Student',
    locationRoomId: 'room-lab-ai-01',
    locationDetail: 'CSE Block, Ground Floor, East Egress Hallway',
    type: 'PERIMETER',
    priority: 'RED',
    status: 'DISPATCHED',
    timestamp: '10:14:15',
    notes: 'Secondary exit alarm sounding; security duty desk notified via automated dispatch.',
    source: 'SIMULATED',
    note: 'demo data',
  },
];

let eventsStore: CampusEvent[] = [
  {
    id: 'evt-101',
    type: 'OCCUPANCY_DISCREPANCY',
    source: 'SIMULATED',
    roomId: 'room-204',
    priority: 'ORANGE',
    confidence: 0.96,
    explanation:
      'Classroom activity not confirmed 18 minutes into Artificial Intelligence lecture block.',
    recommendedAction: 'Engage 10-minute countdown for automated lighting/HVAC setback.',
    status: 'OPEN',
    timestamp: '10:18:22',
    note: 'demo data',
  },
  {
    id: 'evt-102',
    type: 'PERIMETER_ALERT',
    source: 'SIMULATED',
    roomId: 'room-lab-ai-01',
    priority: 'RED',
    confidence: 0.99,
    explanation: 'Egress door sensor open state recorded without badge scan.',
    recommendedAction: 'Dispatch campus patrol unit to CSE Block Ground East.',
    status: 'OPEN',
    timestamp: '10:14:15',
    note: 'demo data',
  },
  {
    id: 'evt-103',
    type: 'ENERGY_ANOMALY',
    source: 'SIMULATED',
    roomId: 'room-102',
    priority: 'YELLOW',
    confidence: 0.88,
    explanation: 'Unscheduled load of 1.8 kW active in Seminar Room 102.',
    recommendedAction: 'Send automated verification prompt to floor facilities staff.',
    status: 'OPEN',
    timestamp: '10:05:40',
    note: 'demo data',
  },
  {
    id: 'evt-104',
    type: 'SETBACK_APPLIED',
    source: 'SIMULATED',
    roomId: 'room-301',
    priority: 'GREEN',
    confidence: 0.95,
    explanation: 'Setback algorithm reduced idle circuit consumption by 85%.',
    recommendedAction: 'Maintain standby monitoring until scheduled afternoon seminar.',
    status: 'RESOLVED',
    timestamp: '09:40:00',
    note: 'demo data',
  },
  {
    id: 'evt-105',
    type: 'TELEMETRY_SYNC',
    source: 'SIMULATED',
    roomId: 'room-202',
    priority: 'GREEN',
    confidence: 0.99,
    explanation: 'Raspberry Pi 4B (demo gateway) published 42 sensor packets with 0 dropped frames.',
    recommendedAction: 'Nominal telemetry ingest rate verified.',
    status: 'RESOLVED',
    timestamp: '09:30:12',
    note: 'demo data',
  },
  {
    id: 'evt-106',
    type: 'OCCUPANCY_CONFIRMED',
    source: 'SIMULATED',
    roomId: 'room-201',
    priority: 'GREEN',
    confidence: 0.97,
    explanation: 'Classroom activity confirmed at 48/50. Dynamic airflow modulation engaged.',
    recommendedAction: 'Target climate comfort envelope active.',
    status: 'RESOLVED',
    timestamp: '09:15:00',
    note: 'demo data',
  },
  {
    id: 'evt-107',
    type: 'SETBACK_STANDBY',
    source: 'SIMULATED',
    roomId: 'room-101',
    priority: 'GREEN',
    confidence: 0.99,
    explanation: 'Unscheduled lecture space maintained in standby setback at 0.1 kW load.',
    recommendedAction: 'Zero energy waste protocol maintained.',
    status: 'RESOLVED',
    timestamp: '08:50:24',
    note: 'demo data',
  },
  {
    id: 'evt-108',
    type: 'TIMETABLE_INGEST',
    source: 'SIMULATED',
    roomId: 'room-204',
    priority: 'GREEN',
    confidence: 1.0,
    explanation: 'Synchronized 482 room allocations across CSE Block and Main Block.',
    recommendedAction: 'Daily timetable schedule verified with Academic Registrar.',
    status: 'RESOLVED',
    timestamp: '08:00:00',
    note: 'demo data',
  },
];

const HOURLY_ENERGY_TODAY: import('../types').EnergyHourlyPoint[] = [
  { time: '06:00', actualKw: 4.2, baselineKw: 8.5, unoccupiedWasteKw: 0.4, source: 'SIMULATED' },
  { time: '07:00', actualKw: 6.8, baselineKw: 12.0, unoccupiedWasteKw: 0.8, source: 'SIMULATED' },
  { time: '08:00', actualKw: 14.5, baselineKw: 22.0, unoccupiedWasteKw: 1.2, source: 'SIMULATED' },
  { time: '09:00', actualKw: 19.8, baselineKw: 26.5, unoccupiedWasteKw: 2.4, source: 'SIMULATED' },
  { time: '10:00', actualKw: 17.8, baselineKw: 28.5, unoccupiedWasteKw: 5.2, source: 'SIMULATED' },
  { time: '11:00', actualKw: 15.2, baselineKw: 27.0, unoccupiedWasteKw: 4.1, source: 'SIMULATED' },
  { time: '12:00', actualKw: 11.4, baselineKw: 20.0, unoccupiedWasteKw: 2.8, source: 'SIMULATED' },
  { time: '13:00', actualKw: 13.6, baselineKw: 22.5, unoccupiedWasteKw: 3.0, source: 'SIMULATED' },
  { time: '14:00', actualKw: 18.2, baselineKw: 27.0, unoccupiedWasteKw: 3.5, source: 'SIMULATED' },
  { time: '15:00', actualKw: 16.5, baselineKw: 25.5, unoccupiedWasteKw: 2.9, source: 'SIMULATED' },
  { time: '16:00', actualKw: 12.8, baselineKw: 21.0, unoccupiedWasteKw: 1.8, source: 'SIMULATED' },
  { time: '17:00', actualKw: 8.2, baselineKw: 15.0, unoccupiedWasteKw: 1.0, source: 'SIMULATED' },
];

const HOURLY_ENERGY_WEEK: import('../types').EnergyHourlyPoint[] = [
  { time: 'Mon', actualKw: 16.4, baselineKw: 26.0, unoccupiedWasteKw: 4.2, source: 'SIMULATED' },
  { time: 'Tue', actualKw: 18.1, baselineKw: 27.5, unoccupiedWasteKw: 4.8, source: 'SIMULATED' },
  { time: 'Wed', actualKw: 17.8, baselineKw: 28.5, unoccupiedWasteKw: 5.2, source: 'SIMULATED' },
  { time: 'Thu', actualKw: 15.9, baselineKw: 25.0, unoccupiedWasteKw: 3.9, source: 'SIMULATED' },
  { time: 'Fri', actualKw: 14.2, baselineKw: 24.0, unoccupiedWasteKw: 3.1, source: 'SIMULATED' },
  { time: 'Sat', actualKw: 6.8, baselineKw: 12.0, unoccupiedWasteKw: 0.9, source: 'SIMULATED' },
  { time: 'Sun', actualKw: 4.5, baselineKw: 8.0, unoccupiedWasteKw: 0.5, source: 'SIMULATED' },
];

const CSE_FLOOR_2_NODES: import('../types').FloorRoomNode[] = [
  {
    id: 'room-201',
    number: '201',
    name: 'Smart Classroom 201',
    x: 35,
    y: 35,
    width: 140,
    height: 110,
    status: 'normal',
    priority: 'GREEN',
    observedOccupancy: 48,
    expectedOccupancy: 50,
    capacity: 55,
    temperature: 23.1,
    energyKw: 2.2,
    hvacStatus: 'ON',
    currentClass: 'Data Structures (CS-201)',
    source: 'SIMULATED',
  },
  {
    id: 'room-202',
    number: '202',
    name: 'Interactive Studio 202',
    x: 190,
    y: 35,
    width: 140,
    height: 110,
    status: 'normal',
    priority: 'GREEN',
    observedOccupancy: 42,
    expectedOccupancy: 45,
    capacity: 50,
    temperature: 23.4,
    energyKw: 2.1,
    hvacStatus: 'ON',
    currentClass: 'Networks (CS-302)',
    source: 'SIMULATED',
  },
  {
    id: 'room-203',
    number: '203',
    name: 'Faculty Tutorial 203',
    x: 345,
    y: 35,
    width: 140,
    height: 110,
    status: 'inactive',
    priority: 'GREEN',
    observedOccupancy: 0,
    expectedOccupancy: 0,
    capacity: 25,
    temperature: 22.8,
    energyKw: 0.2,
    hvacStatus: 'SETBACK',
    currentClass: 'Unscheduled',
    source: 'SIMULATED',
  },
  {
    id: 'room-204',
    number: '204',
    name: 'Lecture Theatre 204',
    x: 500,
    y: 35,
    width: 155,
    height: 110,
    status: 'review',
    priority: 'ORANGE',
    observedOccupancy: 0,
    expectedOccupancy: 60,
    capacity: 60,
    temperature: 23.8,
    energyKw: 3.4,
    hvacStatus: 'ON',
    currentClass: 'Artificial Intelligence (AI-401)',
    source: 'SIMULATED',
  },
  {
    id: 'room-205',
    number: '205',
    name: 'Embedded Systems Lab',
    x: 35,
    y: 215,
    width: 175,
    height: 115,
    status: 'attention',
    priority: 'YELLOW',
    observedOccupancy: 4,
    expectedOccupancy: 0,
    capacity: 35,
    temperature: 24.1,
    energyKw: 1.8,
    hvacStatus: 'ON',
    currentClass: 'Open Project Access',
    source: 'SIMULATED',
  },
  {
    id: 'room-206',
    number: '206',
    name: 'Department Telecom & Server Hub',
    x: 225,
    y: 215,
    width: 130,
    height: 115,
    status: 'normal',
    priority: 'GREEN',
    observedOccupancy: 1,
    expectedOccupancy: 2,
    capacity: 6,
    temperature: 20.6,
    energyKw: 2.8,
    hvacStatus: 'ON',
    currentClass: 'Infrastructure Operations',
    source: 'SIMULATED',
  },
  {
    id: 'room-fac-2b',
    number: '207',
    name: 'Facilities & Restrooms',
    x: 370,
    y: 215,
    width: 135,
    height: 115,
    status: 'inactive',
    priority: 'GREEN',
    observedOccupancy: 2,
    expectedOccupancy: 0,
    capacity: 12,
    temperature: 22.4,
    energyKw: 0.4,
    hvacStatus: 'SETBACK',
    currentClass: 'Building Services',
    source: 'SIMULATED',
  },
  {
    id: 'room-egress-2b',
    number: '208',
    name: 'East Egress Stairwell 2B',
    x: 520,
    y: 215,
    width: 135,
    height: 115,
    status: 'normal',
    priority: 'GREEN',
    observedOccupancy: 0,
    expectedOccupancy: 0,
    capacity: 0,
    temperature: 22.0,
    energyKw: 0.1,
    hvacStatus: 'OFF',
    currentClass: 'Fire Exit Route',
    source: 'SIMULATED',
  },
];

// Exported typed MockClient implementation
export const mockClient: ApiClient = {
  // 1. getRooms
  async getRooms(blockFilter?: string): Promise<Room[]> {
    let result = [...roomsStore];
    if (blockFilter && blockFilter !== 'ALL') {
      result = result.filter((r) => r.block === blockFilter);
    }
    return latency(result);
  },

  // 2. getRoom
  async getRoom(roomId: string): Promise<Room | null> {
    const room = roomsStore.find((r) => r.id === roomId || r.number === roomId);
    return latency(room || null);
  },

  // 2b. getClassroomStatus
  async getClassroomStatus(): Promise<ClassroomStatusItem[]> {
    const items: ClassroomStatusItem[] = roomsStore.map((r) => {
      const tt = timetableStore.find((t) => t.roomId === r.id && t.isCurrent);
      return {
        roomId: r.id,
        roomNumber: r.number,
        name: r.name,
        block: r.block,
        floor: r.floor,
        status: r.status,
        priority: r.priority,
        classState: r.classState,
        expectedOccupancy: r.expectedOccupancy,
        observedHeadcount: r.observedHeadcount,
        currentClass: tt ? `${tt.subject} (${tt.code})` : r.currentClass,
        timeSlot: tt?.timeSlot || r.classTime,
        powerKw: r.energyKw,
        source: r.source,
        gracePeriodRemainingSec: r.classState === 'UNCONFIRMED_ACTIVITY' ? 180 : 0,
      };
    });
    return latency(items);
  },

  // 3. getTimetable
  async getTimetable(roomId?: string): Promise<TimetableEntry[]> {
    if (roomId) {
      return latency(timetableStore.filter((t) => t.roomId === roomId));
    }
    return latency([...timetableStore]);
  },

  // 4. getOccupancy
  async getOccupancy(roomId?: string): Promise<OccupancyReading[]> {
    const targetRooms = roomId
      ? roomsStore.filter((r) => r.id === roomId)
      : roomsStore;

    const readings: OccupancyReading[] = targetRooms.map((r) => ({
      id: `occ-${r.id}`,
      roomId: r.id,
      expected: r.expectedOccupancy,
      observed: r.observedHeadcount,
      confidence: 0.94,
      source: r.source,
      timestamp: new Date().toTimeString().split(' ')[0],
      note: 'demo data',
    }));

    return latency(readings);
  },

  // 5. getSensors
  async getSensors(roomId?: string): Promise<SensorReading[]> {
    const targetRoomId = roomId || 'room-204';
    const room = roomsStore.find((r) => r.id === targetRoomId) || roomsStore[4];

    const sensors: SensorReading[] = [
      {
        deviceId: `PIR-${room.number}`,
        source: 'SIMULATED',
        roomId: room.id,
        type: 'PIR_MOTION',
        value: room.motionDetected,
        unit: 'state',
        timestamp: 'Just now',
        note: 'demo data',
      },
      {
        deviceId: `CAM-${room.number}`,
        source: 'SIMULATED',
        roomId: room.id,
        type: 'CAMERA_HEADCOUNT',
        value: room.observedHeadcount,
        unit: 'persons',
        timestamp: '1s ago',
        note: 'demo data',
      },
      {
        deviceId: `TEMP-${room.number}`,
        source: 'SIMULATED',
        roomId: room.id,
        type: 'TEMPERATURE',
        value: 23.4,
        unit: '°C',
        timestamp: '3s ago',
        note: 'demo data',
      },
      {
        deviceId: `CT-CLAMP-${room.number}`,
        source: 'SIMULATED',
        roomId: room.id,
        type: 'POWER_CURRENT',
        value: 'Not installed',
        unit: 'kW (Simulated)',
        timestamp: 'Not installed',
        note: 'demo data',
      },
      {
        deviceId: `DOOR-${room.number}`,
        source: 'SIMULATED',
        roomId: room.id,
        type: 'DOOR_CONTACT',
        value: 'Not installed',
        unit: 'status (Simulated)',
        timestamp: 'Not installed',
        note: 'demo data',
      },
      {
        deviceId: `IAQ-${room.number}`,
        source: 'SIMULATED',
        roomId: room.id,
        type: 'AIR_QUALITY',
        value: 'Not installed',
        unit: 'ppm (Simulated)',
        timestamp: 'Not installed',
        note: 'demo data',
      },
    ];

    return latency(sensors);
  },

  // 6. getEvents
  async getEvents(): Promise<CampusEvent[]> {
    return latency([...eventsStore]);
  },

  // 7. getAlerts
  async getAlerts(priorityFilter?: PriorityLevel): Promise<Alert[]> {
    let result = [...alertsStore];
    if (priorityFilter) {
      result = result.filter((a) => a.priority === priorityFilter);
    }
    return latency(result);
  },

  // 8. acknowledgeAlert
  async acknowledgeAlert(id: string): Promise<{ success: boolean; alert: Alert }> {
    const alert = alertsStore.find((a) => a.id === id);
    if (alert) {
      alert.status = 'ACKNOWLEDGED';
      alert.triageStatus = 'Acknowledged';
      alert.acknowledged = true;
      if (!alert.history) alert.history = [];
      alert.history.push({
        id: `h-ack-${Date.now()}`,
        timestamp: new Date().toTimeString().split(' ')[0],
        status: 'Acknowledged',
        actor: 'Current Operator',
        note: 'Alert triaged and acknowledged in operational console.',
      });
    }
    return latency({ success: true, alert: alert! });
  },

  // 9. resolveAlert
  async resolveAlert(id: string, note?: string): Promise<{ success: boolean; alert: Alert }> {
    const alert = alertsStore.find((a) => a.id === id);
    if (alert) {
      alert.status = 'RESOLVED';
      alert.triageStatus = 'Resolved';
      if (!alert.history) alert.history = [];
      alert.history.push({
        id: `h-res-${Date.now()}`,
        timestamp: new Date().toTimeString().split(' ')[0],
        status: 'Resolved',
        actor: 'Current Operator',
        note: note || 'Resolved with confirmation note.',
      });
    }
    return latency({ success: true, alert: alert! });
  },

  // 9b. assignAlert
  async assignAlert(id: string, assignee: string): Promise<{ success: boolean; alert: Alert }> {
    const alert = alertsStore.find((a) => a.id === id);
    if (alert) {
      alert.assignee = assignee;
      alert.status = 'ACTIVE';
      alert.triageStatus = 'In progress';
      if (!alert.history) alert.history = [];
      alert.history.push({
        id: `h-asg-${Date.now()}`,
        timestamp: new Date().toTimeString().split(' ')[0],
        status: 'In progress',
        actor: 'Current Operator',
        note: `Assigned investigation task to ${assignee}.`,
      });
    }
    return latency({ success: true, alert: alert! });
  },

  // 9c. updateAlertStatus
  async updateAlertStatus(
    id: string,
    status: import('../types').AlertStatus,
    note?: string
  ): Promise<{ success: boolean; alert: Alert }> {
    const alert = alertsStore.find((a) => a.id === id);
    if (alert) {
      alert.triageStatus = status;
      alert.status = status === 'Resolved' ? 'RESOLVED' : status === 'Acknowledged' ? 'ACKNOWLEDGED' : 'ACTIVE';
      if (status === 'Acknowledged') alert.acknowledged = true;
      if (!alert.history) alert.history = [];
      alert.history.push({
        id: `h-upd-${Date.now()}`,
        timestamp: new Date().toTimeString().split(' ')[0],
        status,
        actor: 'Current Operator',
        note: note || `Status transitioned to ${status}.`,
      });
    }
    return latency({ success: true, alert: alert! });
  },

  // 9d. bulkUpdateAlerts
  async bulkUpdateAlerts(
    ids: string[],
    action: 'Acknowledge' | 'Resolve' | 'Assign',
    assignee?: string,
    note?: string
  ): Promise<{ success: boolean; alerts: Alert[] }> {
    const updated: Alert[] = [];
    const timestamp = new Date().toTimeString().split(' ')[0];

    for (const id of ids) {
      const alert = alertsStore.find((a) => a.id === id);
      if (alert) {
        if (!alert.history) alert.history = [];
        if (action === 'Acknowledge') {
          alert.status = 'ACKNOWLEDGED';
          alert.triageStatus = 'Acknowledged';
          alert.acknowledged = true;
          alert.history.push({
            id: `h-bulk-ack-${id}-${Date.now()}`,
            timestamp,
            status: 'Acknowledged',
            actor: 'Bulk Operator Action',
            note: 'Acknowledged via batch triage bar.',
          });
        } else if (action === 'Resolve') {
          alert.status = 'RESOLVED';
          alert.triageStatus = 'Resolved';
          alert.history.push({
            id: `h-bulk-res-${id}-${Date.now()}`,
            timestamp,
            status: 'Resolved',
            actor: 'Bulk Operator Action',
            note: note || 'Resolved via bulk action.',
          });
        } else if (action === 'Assign') {
          alert.assignee = assignee || 'Facilities Desk';
          alert.triageStatus = 'In progress';
          alert.history.push({
            id: `h-bulk-asg-${id}-${Date.now()}`,
            timestamp,
            status: 'In progress',
            actor: 'Bulk Operator Action',
            note: `Assigned in bulk to ${alert.assignee}.`,
          });
        }
        updated.push(alert);
      }
    }
    return latency({ success: true, alerts: updated });
  },

  // 10. getDevices
  async getDevices(): Promise<EdgeDevice[]> {
    return latency([...devicesStore]);
  },

  // 11. createEmergency
  async createEmergency(request: {
    requesterName: string;
    requesterRole: 'Student' | 'Faculty' | 'Staff' | 'Admin / HOD';
    locationRoomId: string;
    locationDetail: string;
    type: 'MEDICAL' | 'PERIMETER' | 'INFRASTRUCTURE' | 'FIRE_HAZARD';
    notes: string;
  }): Promise<EmergencyRequest> {
    const newEmergency: EmergencyRequest = {
      id: `EMG-${Math.floor(100 + Math.random() * 900)}`,
      requesterName: request.requesterName,
      requesterRole: request.requesterRole,
      locationRoomId: request.locationRoomId,
      locationDetail: request.locationDetail,
      type: request.type,
      priority: 'RED',
      status: 'DISPATCHED',
      timestamp: new Date().toTimeString().split(' ')[0],
      notes: request.notes,
      source: 'SIMULATED',
      note: 'demo data',
    };

    emergenciesStore = [newEmergency, ...emergenciesStore];

    // also create corresponding critical alert
    const relatedAlert: Alert = {
      id: `ALT-EMG-${newEmergency.id}`,
      roomId: request.locationRoomId,
      roomName: request.locationDetail,
      block: 'Campus Central',
      title: `Emergency dispatch: ${request.type}`,
      description: `Rapid dispatch initiated by ${request.requesterRole} (${request.requesterName}). ${request.notes}`,
      expectedState: 'Secured zone',
      observedState: 'Emergency alert trigger active',
      gracePeriodMinutes: 0,
      priority: 'RED',
      status: 'ACTIVE',
      source: 'SIMULATED',
      timestamp: newEmergency.timestamp,
      energyImpactKw: 0,
      note: 'demo data',
    };
    alertsStore = [relatedAlert, ...alertsStore];

    return latency(newEmergency);
  },

  // 12. getEnergySummary
  async getEnergySummary(): Promise<EnergySummary> {
    const summary: EnergySummary = {
      totalKw: 17.8,
      baselineKw: 28.5,
      dailyKwh: 142.6,
      estimatedWasteKwh: 24.3,
      co2KgSaved: 48.7,
      sdgTargetAchievedPercent: 88.4,
      unoccupiedWasteKw: 5.2,
      source: 'SIMULATED',
      note: 'demo data',
    };
    return latency(summary);
  },

  // 13. askAssistant
  async askAssistant(
    query: string,
    options?: { degradedMode?: boolean }
  ): Promise<AssistantResponse> {
    const q = query.toLowerCase().trim();
    const isDegraded = options?.degradedMode ?? false;

    // Default structure
    let answer = '';
    const toolCalls: AssistantToolCall[] = [];
    const sourceRecords: AssistantSourceRecord[] = [];
    let suggestedActions: string[] = [];
    let relevantRooms: string[] = [];

    // Query 1: Classrooms needing attention
    if (
      q.includes('attention') ||
      q.includes('need attention') ||
      q.includes('which classrooms') ||
      q.includes('unconfirmed')
    ) {
      toolCalls.push({
        id: 'tc-alerts',
        tool: 'getClassroomAlerts()',
        resultSummary: '2 discrepancies active',
        recordsCount: 2,
        source: 'SIMULATED',
        records: [
          {
            id: 'ALT-204',
            title: 'Room 204: Class commencement review',
            subtitle: 'Unconfirmed activity past 10m grace period · 3.4 kW draw',
            category: 'Alert',
            badge: 'ORANGE',
            link: '/rooms/room-204',
          },
          {
            id: 'ALT-LAB-01',
            title: 'LAB-AI-01: Perimeter hardware alert',
            subtitle: 'Secondary egress reed contact open outside schedule',
            category: 'Alert',
            badge: 'RED',
            link: '/rooms/room-lab-ai-01',
          },
        ],
      });

      toolCalls.push({
        id: 'tc-rooms',
        tool: "getRoomsByPriority(['ORANGE', 'RED'])",
        resultSummary: '2 rooms matched',
        recordsCount: 2,
        source: 'SIMULATED',
        records: [
          {
            id: 'room-204',
            title: 'Lecture Hall 204',
            subtitle: 'CSE Block 2nd Floor · Capacity 60',
            category: 'Room',
            badge: 'Review',
            link: '/rooms/room-204',
          },
          {
            id: 'room-lab-ai-01',
            title: 'AI & Robotics Hub 01',
            subtitle: 'CSE Block Ground · Capacity 40',
            category: 'Room',
            badge: 'Critical',
            link: '/rooms/room-lab-ai-01',
          },
        ],
      });

      sourceRecords.push(
        {
          id: 'room-204',
          title: 'Lecture Hall 204',
          subtitle: 'CSE Block, 2nd Floor',
          category: 'Room',
          source: 'SIMULATED',
          status: 'Review Required',
          badge: 'ORANGE',
          details: 'Expected: 60 occupants (AI-401). Observed: 0 occupants. Active power: 3.4 kW.',
          link: '/rooms/room-204',
          metrics: { Headcount: 0, Capacity: 60, Power: '3.4 kW' },
        },
        {
          id: 'room-lab-ai-01',
          title: 'AI & Robotics Hub 01',
          subtitle: 'CSE Block, Ground Floor',
          category: 'Room',
          source: 'SIMULATED',
          status: 'Critical Alert',
          badge: 'RED',
          details: 'Door contact interrupted at 10:14:15. Motion detected near server rack.',
          link: '/rooms/room-lab-ai-01',
          metrics: { Headcount: 1, Capacity: 40, Status: 'Door Open' },
        },
        {
          id: 'alt-204',
          title: 'ALT-204: Commencement Discrepancy',
          subtitle: 'Commencement Grace Engine',
          category: 'Alert',
          source: 'SIMULATED',
          status: 'New',
          badge: 'ORANGE',
          details: '10-minute grace window elapsed without confirmed student headcount.',
          link: '/alerts',
        }
      );

      answer =
        'Two classrooms currently require operator attention: Lecture Hall 204 (CSE Block Level 2) has unconfirmed attendance with 3.4 kW continuous load past the 10-minute grace period, and AI & Robotics Hub 01 (CSE Ground) has an active perimeter discrepancy on secondary egress contacts.';
      suggestedActions = [
        'Inspect Room 204 Telemetry',
        'Review Perimeter Dispatch',
        'Initiate Setback Routine',
      ];
      relevantRooms = ['room-204', 'room-lab-ai-01'];
    }
    // Query 2: Classes running now
    else if (
      q.includes('classes are running') ||
      q.includes('running now') ||
      q.includes('current class') ||
      q.includes('timetable')
    ) {
      toolCalls.push({
        id: 'tc-tt',
        tool: "getTimetable(slot='10:00-11:00')",
        resultSummary: '2 slots scheduled',
        recordsCount: 2,
        source: 'SIMULATED',
        records: [
          {
            id: 'tt-204-1',
            title: 'Artificial Intelligence (AI-401)',
            subtitle: 'Room 204 · CSE-A · Dr. Suresh Varma · 10:00-11:00',
            category: 'Timetable',
            badge: 'Current',
            link: '/rooms/room-204',
          },
          {
            id: 'tt-ai-02',
            title: 'Edge ML Practicum (AI-490)',
            subtitle: 'LAB-AI-02 · CSE-A · Dr. Malini Rao · 09:30-11:30',
            category: 'Timetable',
            badge: 'Current',
            link: '/rooms/room-lab-ai-02',
          },
        ],
      });

      toolCalls.push({
        id: 'tc-occ',
        tool: "getLiveOccupancy(['room-204', 'room-lab-ai-02'])",
        resultSummary: '2 inference feeds',
        recordsCount: 2,
        source: 'SIMULATED',
        records: [
          {
            id: 'occ-204',
            title: 'CAM-204 Inference: 0 people',
            subtitle: 'Expected: 60 · Confidence: 94%',
            category: 'Sensor',
            badge: 'Unconfirmed',
          },
          {
            id: 'occ-lab-02',
            title: 'CAM-LAB-02 Inference: 26 people',
            subtitle: 'Expected: 28 · Confidence: 96%',
            category: 'Sensor',
            badge: 'Confirmed',
          },
        ],
      });

      sourceRecords.push(
        {
          id: 'tt-204-1',
          title: 'Artificial Intelligence (AI-401)',
          subtitle: 'Lecture Hall 204 · Section CSE-A',
          category: 'Timetable',
          source: 'SIMULATED',
          status: 'Unconfirmed (0/60)',
          badge: 'ORANGE',
          details: 'Scheduled 10:00 - 11:00. Faculty: Dr. Suresh Varma. Expected: 60 students.',
          link: '/rooms/room-204',
          metrics: { Expected: 60, Observed: 0, Time: '10:00-11:00' },
        },
        {
          id: 'tt-lab-02',
          title: 'Edge ML Practicum (AI-490)',
          subtitle: 'Computer Vision Testbed 02 (LAB-AI-02)',
          category: 'Timetable',
          source: 'SIMULATED',
          status: 'Confirmed (26/28)',
          badge: 'GREEN',
          details: 'Scheduled 09:30 - 11:30. Faculty: Dr. Malini Rao. Expected: 28 students.',
          link: '/rooms/room-lab-ai-02',
          metrics: { Expected: 28, Observed: 26, Time: '09:30-11:30' },
        }
      );

      answer =
        'Two classes are scheduled at this hour (10:00–11:00): Artificial Intelligence (AI-401, CSE-A) in Room 204 with 0 observed students of 60 scheduled (unconfirmed commencement), and Edge ML Practicum (AI-490) in LAB-AI-02 with 26 observed students of 28 scheduled (confirmed active).';
      suggestedActions = [
        'Check Room 204 Camera',
        'Inspect LAB-AI-02 Occupancy',
        'View Master Timetable',
      ];
      relevantRooms = ['room-204', 'room-lab-ai-02'];
    }
    // Query 3: Offline sensors
    else if (
      q.includes('sensors are offline') ||
      q.includes('sensor offline') ||
      q.includes('offline device') ||
      q.includes('devices offline')
    ) {
      toolCalls.push({
        id: 'tc-dev-offline',
        tool: "getEdgeDevices(status='OFFLINE' | 'DEGRADED')",
        resultSummary: '1 degraded node',
        recordsCount: 1,
        source: 'SIMULATED',
        records: [
          {
            id: 'PI-CAM-204',
            title: 'PI-CAM-204: Camera node',
            subtitle: 'Last ping intermittent',
            category: 'Device',
            badge: 'DEGRADED',
            link: '/rooms/room-204',
          },
        ],
      });

      toolCalls.push({
        id: 'tc-gateways',
        tool: 'getGatewayHeartbeats()',
        resultSummary: '3 gateways online (<500ms)',
        recordsCount: 3,
        source: 'SIMULATED',
        records: [
          {
            id: 'PI-GW-CSE-02',
            title: 'PI-GW-CSE-02: Raspberry Pi 4B (demo gateway)',
            subtitle: 'IP: -- · Latency: 500ms',
            category: 'Device',
            badge: 'ONLINE',
          },
        ],
      });

      sourceRecords.push(
        {
          id: 'dev-pi-cam-204',
          title: 'PI-CAM-204 (Camera node)',
          subtitle: 'Lecture Hall 204, CSE Level 2',
          category: 'Device',
          source: 'SIMULATED',
          status: 'Degraded / Heartbeat Check',
          badge: 'YELLOW',
          details: 'IP: -- · Firmware: v2.4.1-edge · Video stream inference 12 FPS.',
          link: '/rooms/room-204',
          metrics: { 'IP Address': '--', Status: 'Degraded' },
        },
        {
          id: 'dev-gw-02',
          title: 'PI-GW-CSE-02 (Raspberry Pi 4B (demo gateway))',
          subtitle: 'CSE Block Level 2 Sub-Station',
          category: 'Device',
          source: 'SIMULATED',
          status: 'Healthy',
          badge: 'GREEN',
          details: 'IP: -- · Firmware: v4.1.2-gw · Ping: 500ms · Ingestion: Nominal.',
          metrics: { 'IP Address': '--', Ping: '500ms', Nodes: '18 active' },
        }
      );

      answer =
        'One edge node is flagged: Camera node (PI-CAM-204) in Room 204 has shown intermittent heartbeat packets during simulated link tests. All campus subnet gateways (PI-GW-CSE-02, PI-GW-MAIN-01) and IR / motion sensors are online with ping latency under 500ms.';
      suggestedActions = [
        'Run Camera Ping Test',
        'Verify Floor 2 Subnet Switch',
        'Inspect Room 204 Sensor Health',
      ];
      relevantRooms = ['room-204'];
    }
    // Query 4: Energy waste
    else if (
      q.includes('wasting energy') ||
      q.includes('energy waste') ||
      q.includes('unoccupied power') ||
      q.includes('waste energy')
    ) {
      toolCalls.push({
        id: 'tc-waste',
        tool: 'getEnergyWasteFlags()',
        resultSummary: '2 rooms flagged (>1.0 kW unoccupied)',
        recordsCount: 2,
        source: 'SIMULATED',
        records: [
          {
            id: 'room-204',
            title: 'Room 204: 3.4 kW draw',
            subtitle: '0 headcount past grace period · AC & fixtures active',
            category: 'Energy',
            badge: '3.4 kW',
            link: '/rooms/room-204',
          },
          {
            id: 'room-102',
            title: 'Room 102: 1.8 kW draw',
            subtitle: 'Unscheduled lighting circuit active · Vacant',
            category: 'Energy',
            badge: '1.8 kW',
            link: '/rooms/room-102',
          },
        ],
      });

      toolCalls.push({
        id: 'tc-submeter',
        tool: 'getSubMeterPowerSummary()',
        resultSummary: '5.2 kW total unoccupied waste',
        recordsCount: 1,
        source: 'SIMULATED',
        records: [
          {
            id: 'submeter-a4',
            title: 'Substation Meter A-4',
            subtitle: 'Current total facility power: 17.8 kW (Baseline: 12.6 kW)',
            category: 'Energy',
            badge: 'SIMULATED',
          },
        ],
      });

      sourceRecords.push(
        {
          id: 'waste-204',
          title: 'Lecture Hall 204 Circuit',
          subtitle: 'CSE Block 2nd Floor',
          category: 'Energy',
          source: 'SIMULATED',
          status: 'Review Required',
          badge: 'ORANGE',
          details: 'Drawing 3.4 kW (Lights 0.45 kW, HVAC/Fan 2.95 kW) while occupancy reading is 0.',
          link: '/rooms/room-204',
          metrics: { 'Power Draw': '3.4 kW', Headcount: 0, 'Grace Expired': 'Yes' },
        },
        {
          id: 'waste-102',
          title: 'Seminar Room 102 Circuit',
          subtitle: 'Main Block Level 1',
          category: 'Energy',
          source: 'SIMULATED',
          status: 'Advisory Alert',
          badge: 'YELLOW',
          details: 'Drawing 1.8 kW on branch lighting relay outside scheduled bookings.',
          link: '/rooms/room-102',
          metrics: { 'Power Draw': '1.8 kW', Headcount: 0, Booking: 'None' },
        }
      );

      answer =
        'Two spaces are flagged for energy waste: Lecture Hall 204 (3.4 kW active draw with 0 headcount during an unconfirmed lecture) and Seminar Room 102 (1.8 kW lighting draw with no scheduled booking). Total unoccupied waste across campus is 5.2 kW.';
      suggestedActions = [
        'Engage Room 204 HVAC Setback',
        'Turn Off Room 102 Relays',
        'View Sustainability Dashboard',
      ];
      relevantRooms = ['room-204', 'room-102'];
    }
    // Query 5: Where is the AI lab?
    else if (
      q.includes('where is the ai lab') ||
      q.includes('ai lab') ||
      q.includes('robotics hub') ||
      q.includes('lab-ai')
    ) {
      toolCalls.push({
        id: 'tc-room-info',
        tool: "getRoomInfo('room-lab-ai-01')",
        resultSummary: '1 space located',
        recordsCount: 1,
        source: 'SIMULATED',
        records: [
          {
            id: 'room-lab-ai-01',
            title: 'AI & Robotics Hub 01 (LAB-AI-01)',
            subtitle: 'CSE Block Ground Floor, East Wing',
            category: 'Room',
            badge: 'Ground',
            link: '/rooms/room-lab-ai-01',
          },
        ],
      });

      toolCalls.push({
        id: 'tc-adjacent',
        tool: "getAdjacentRooms('room-lab-ai-01')",
        resultSummary: '1 adjacent lab',
        recordsCount: 1,
        source: 'SIMULATED',
        records: [
          {
            id: 'room-lab-ai-02',
            title: 'Computer Vision Testbed 02 (LAB-AI-02)',
            subtitle: 'CSE Block Ground Floor · Capacity 30',
            category: 'Room',
            link: '/rooms/room-lab-ai-02',
          },
        ],
      });

      sourceRecords.push(
        {
          id: 'room-lab-ai-01',
          title: 'AI & Robotics Hub 01 (LAB-AI-01)',
          subtitle: 'CSE Block, Ground Floor',
          category: 'Room',
          source: 'SIMULATED',
          status: 'Access Controlled',
          badge: 'RED',
          details: 'Capacity 40. Equipped with 8 edge robotics test benches and camera node.',
          link: '/rooms/room-lab-ai-01',
          metrics: { Location: 'CSE Ground', Capacity: 40, Type: 'Specialized Lab' },
        },
        {
          id: 'room-lab-ai-02',
          title: 'Computer Vision Testbed 02 (LAB-AI-02)',
          subtitle: 'CSE Block, Ground Floor',
          category: 'Room',
          source: 'SIMULATED',
          status: 'Active (26/28)',
          badge: 'GREEN',
          details: 'Capacity 30. Adjacent to Hub 01. Currently hosting Edge ML Practicum.',
          link: '/rooms/room-lab-ai-02',
          metrics: { Location: 'CSE Ground', Capacity: 30, Headcount: 26 },
        }
      );

      answer =
        'AI & Robotics Hub 01 (LAB-AI-01) is located on the Ground Floor of the CSE Block (East Wing), adjacent to Computer Vision Testbed 02 (LAB-AI-02). It features 40 student workstations and access-controlled equipment racks.';
      suggestedActions = [
        'Open LAB-AI-01 Room Card',
        'View CSE Ground Floor Plan',
        'Inspect LAB-AI-01 Sensors',
      ];
      relevantRooms = ['room-lab-ai-01', 'room-lab-ai-02'];
    }
    // Query 6: Active alerts
    else if (
      q.includes('active alerts') ||
      q.includes('show alerts') ||
      q.includes('alerts queue') ||
      q.includes('discrepancies')
    ) {
      toolCalls.push({
        id: 'tc-alerts-active',
        tool: "getAlerts(status='ACTIVE')",
        resultSummary: '4 active discrepancies',
        recordsCount: 4,
        source: 'SIMULATED',
        records: [
          {
            id: 'ALT-LAB-01',
            title: 'Emergency perimeter hardware alert',
            subtitle: 'LAB-AI-01 · Red · Door contact open',
            category: 'Alert',
            badge: 'RED',
            link: '/alerts',
          },
          {
            id: 'ALT-204',
            title: 'Class commencement review',
            subtitle: 'Room 204 · Orange · Unconfirmed activity',
            category: 'Alert',
            badge: 'ORANGE',
            link: '/alerts',
          },
          {
            id: 'ALT-102',
            title: 'Unscheduled electrical load registered',
            subtitle: 'Room 102 · Yellow · 1.8 kW draw',
            category: 'Alert',
            badge: 'YELLOW',
            link: '/alerts',
          },
          {
            id: 'ALT-301',
            title: 'Automated setback verification pending',
            subtitle: 'Room 301 · Yellow · Recess slot',
            category: 'Alert',
            badge: 'YELLOW',
            link: '/alerts',
          },
        ],
      });

      sourceRecords.push(
        {
          id: 'alt-lab',
          title: 'ALT-LAB-01: Perimeter Hardware',
          subtitle: 'LAB-AI-01 · Security Patrol #04',
          category: 'Alert',
          source: 'SIMULATED',
          status: 'Active / Critical',
          badge: 'RED',
          details: 'Egress contact interrupted without badge scan.',
          link: '/alerts',
        },
        {
          id: 'alt-204-s',
          title: 'ALT-204: Commencement Discrepancy',
          subtitle: 'Room 204 · Facilities Desk',
          category: 'Alert',
          source: 'SIMULATED',
          status: 'Active / Review',
          badge: 'ORANGE',
          details: 'Classroom activity not confirmed within grace period.',
          link: '/alerts',
        },
        {
          id: 'alt-102-s',
          title: 'ALT-102: Unscheduled Circuit Draw',
          subtitle: 'Room 102 · Main Block',
          category: 'Alert',
          source: 'SIMULATED',
          status: 'Acknowledged',
          badge: 'YELLOW',
          details: '1.8 kW lighting load active outside bookings.',
          link: '/alerts',
        }
      );

      answer =
        'There are 4 active discrepancies in the operational queue: 1 Critical Red (LAB-AI-01 perimeter door contact), 1 Review Orange (Room 204 unconfirmed class with 3.4 kW circuit draw), and 2 Advisory Yellow (Room 102 unscheduled load and Room 301 setback verification).';
      suggestedActions = [
        'Open Alerts Triage Workspace',
        'Acknowledge All High-Priority',
        'Inspect LAB-AI-01 Incident',
      ];
      relevantRooms = ['room-lab-ai-01', 'room-204', 'room-102'];
    }
    // Query 7: Room 204 specific
    else if (q.includes('204')) {
      toolCalls.push({
        id: 'tc-room-204',
        tool: "getRoom('room-204')",
        resultSummary: '1 room record',
        recordsCount: 1,
        source: 'SIMULATED',
        records: [
          {
            id: 'room-204',
            title: 'Lecture Hall 204 (CSE Block)',
            subtitle: 'Headcount 0 · Expected 60 · Power 3.4 kW',
            category: 'Room',
            badge: 'ORANGE',
            link: '/rooms/room-204',
          },
        ],
      });

      sourceRecords.push({
        id: 'room-204',
        title: 'Lecture Hall 204',
        subtitle: 'CSE Block, Level 2',
        category: 'Room',
        source: 'SIMULATED',
        status: 'Review Required',
        badge: 'ORANGE',
        details: 'Classroom activity has not been confirmed within 10-minute grace window.',
        link: '/rooms/room-204',
        metrics: { Capacity: 60, Headcount: 0, 'Current Power': '3.4 kW' },
      });

      answer =
        'Room 204 is Lecture Hall 204 on CSE Block 2nd Floor. Current status: Review Required (ORANGE). Scheduled class Artificial Intelligence (AI-401) has 0 confirmed headcount vs 60 capacity, and fixtures are drawing 3.4 kW past grace thresholds.';
      suggestedActions = [
        'Open Room 204 Control Console',
        'Run Setback Routine',
        'View 24h Occupancy Curve',
      ];
      relevantRooms = ['room-204'];
    }
    // Out of domain / Unavailable data fallback
    else {
      toolCalls.push({
        id: 'tc-registry',
        tool: `queryCampusTelemetry("${query.slice(0, 30)}")`,
        resultSummary: '0 matching records found',
        recordsCount: 0,
        source: 'SIMULATED',
        records: [],
      });

      answer =
        `Telemetry and timetable records for "${query}" are unavailable in the CAMPUSCARE registry. Answers come from campus data (active buildings: CSE Block and Main Block). If specific room or sensor data is needed, query a registered space such as Room 204, LAB-AI-01, or energy meters.`;
      suggestedActions = [
        'Which classrooms need attention?',
        'What classes are running now?',
        'Which rooms are wasting energy?',
      ];
      relevantRooms = [];
    }

    return latency({
      answer,
      toolCalls,
      sourceRecords,
      suggestedActions,
      relevantRooms,
      source: 'SIMULATED',
      degradedMode: isDegraded,
      note: 'demo data',
    });
  },

  // 14. runScenario
  async runScenario(scenarioId: string): Promise<{
    name: string;
    description: string;
    affectedRooms: Room[];
    note: string;
  }> {
    const r204 = roomsStore.find((r) => r.id === 'room-204');

    if (scenarioId === 'normal-class') {
      if (r204) {
        r204.observedHeadcount = 48;
        r204.expectedOccupancy = 60;
        r204.motionDetected = true;
        r204.energyKw = 1.2;
        r204.status = 'normal';
        r204.priority = 'GREEN';
        r204.classState = 'ACTIVE_CONFIRMED';
        r204.lightStatus = 'ON';
        r204.hvacStatus = 'ON';
      }
      return latency({
        name: 'Normal Class In Session',
        description: 'Room 204 has 48 students verified by camera node, HVAC in comfort mode.',
        affectedRooms: roomsStore,
        note: 'demo data',
      });
    } else if (scenarioId === 'started-late') {
      if (r204) {
        r204.observedHeadcount = 14;
        r204.expectedOccupancy = 60;
        r204.motionDetected = true;
        r204.energyKw = 1.6;
        r204.status = 'attention';
        r204.priority = 'YELLOW';
        r204.classState = 'UNCONFIRMED_ACTIVITY';
        r204.lightStatus = 'ON';
        r204.hvacStatus = 'ON';
      }
      const existing = alertsStore.find((a) => a.id === 'ALT-SCN-STARTED-LATE');
      if (!existing) {
        alertsStore.unshift({
          id: 'ALT-SCN-STARTED-LATE',
          roomId: 'room-204',
          roomName: 'Lecture Hall 204',
          block: 'CSE Block',
          title: 'Class commencement delayed (14 students)',
          description: '14/60 students entered 5 minutes into scheduled slot. Within 10 min grace period.',
          expectedState: 'Full lecture attendance (60)',
          observedState: '14 students detected (vision 94%)',
          gracePeriodMinutes: 10,
          priority: 'YELLOW',
          status: 'ACTIVE',
          source: 'SIMULATED',
          timestamp: '10:05:00',
          energyImpactKw: 1.6,
          triageStatus: 'New',
          note: 'demo data',
        });
      }
      return latency({
        name: 'Class Started Late (Grace Window Active)',
        description: '14 students entering at 10:05 AM. System flags yellow advisory within grace window.',
        affectedRooms: roomsStore,
        note: 'demo data',
      });
    } else if (scenarioId === 'class-not-confirmed' || scenarioId === 'empty-lecture-waste') {
      if (r204) {
        r204.observedHeadcount = 0;
        r204.expectedOccupancy = 60;
        r204.motionDetected = false;
        r204.energyKw = 3.2;
        r204.status = 'review';
        r204.priority = 'ORANGE';
        r204.classState = 'UNCONFIRMED_ACTIVITY';
        r204.lightStatus = 'ON';
        r204.hvacStatus = 'ON';
      }
      return latency({
        name: 'Class Not Confirmed (Review Raised)',
        description: 'Room 204 has 60 expected students, 0 observed past 10 min grace threshold. Lights and HVAC draw 3.2 kW.',
        affectedRooms: roomsStore,
        note: 'demo data',
      });
    } else if (scenarioId === 'unexpected-occupancy') {
      if (r204) {
        r204.observedHeadcount = 35;
        r204.expectedOccupancy = 0;
        r204.currentClass = 'Unscheduled Study Session';
        r204.motionDetected = true;
        r204.energyKw = 2.1;
        r204.status = 'attention';
        r204.priority = 'YELLOW';
        r204.classState = 'UNSCHEDULED_OCCUPIED';
        r204.lightStatus = 'ON';
        r204.hvacStatus = 'ON';
      }
      const existing = alertsStore.find((a) => a.id === 'ALT-SCN-UNEXPECTED');
      if (!existing) {
        alertsStore.unshift({
          id: 'ALT-SCN-UNEXPECTED',
          roomId: 'room-204',
          roomName: 'Lecture Hall 204',
          block: 'CSE Block',
          title: 'Unexpected room occupancy during unscheduled slot',
          description: '35 occupants detected in Room 204 during unscheduled free slot. Lighting circuits active.',
          expectedState: 'Vacant / Unscheduled',
          observedState: '35 occupants detected',
          gracePeriodMinutes: 0,
          priority: 'YELLOW',
          status: 'ACTIVE',
          source: 'SIMULATED',
          timestamp: '11:45:00',
          energyImpactKw: 2.1,
          triageStatus: 'New',
          note: 'demo data',
        });
      }
      return latency({
        name: 'Unexpected Room Occupancy',
        description: 'Room timetable shows vacant slot, but optical sensor detects 35 students gathered.',
        affectedRooms: roomsStore,
        note: 'demo data',
      });
    } else if (scenarioId === 'high-temperature') {
      if (r204) {
        r204.observedHeadcount = 42;
        r204.expectedOccupancy = 60;
        r204.energyKw = 4.4;
        r204.status = 'review';
        r204.priority = 'ORANGE';
        r204.hvacStatus = 'OFF';
      }
      const existing = alertsStore.find((a) => a.id === 'ALT-SCN-HIGHTEMP');
      if (!existing) {
        alertsStore.unshift({
          id: 'ALT-SCN-HIGHTEMP',
          roomId: 'room-204',
          roomName: 'Lecture Hall 204',
          block: 'CSE Block',
          title: 'Thermal threshold alert: 36.8°C exceeded',
          description: 'Ambient temperature reached 36.8°C exceeding 30.0°C safety limit. HVAC compressor offline.',
          expectedState: 'Comfort band 22-26°C',
          observedState: '36.8°C measured',
          gracePeriodMinutes: 5,
          priority: 'ORANGE',
          status: 'ACTIVE',
          source: 'SIMULATED',
          timestamp: '10:14:00',
          energyImpactKw: 4.4,
          triageStatus: 'New',
          note: 'demo data',
        });
      }
      return latency({
        name: 'High Temperature Threshold Exceeded',
        description: 'Ambient temperature logged at 36.8°C with HVAC malfunction in Room 204.',
        affectedRooms: roomsStore,
        note: 'demo data',
      });
    } else if (scenarioId === 'sensor-offline') {
      if (r204) {
        r204.status = 'attention';
        r204.priority = 'YELLOW';
      }
      const existing = alertsStore.find((a) => a.id === 'ALT-SCN-SENSOR-OFFLINE');
      if (!existing) {
        alertsStore.unshift({
          id: 'ALT-SCN-SENSOR-OFFLINE',
          roomId: 'room-204',
          roomName: 'Lecture Hall 204',
          block: 'CSE Block',
          title: 'Edge sensor node ESP-204 heartbeat timeout',
          description: 'ESP8266 multi-sensor environmental beacon missed 3 consecutive heartbeat intervals (>5m).',
          expectedState: 'Heartbeat every 30s',
          observedState: 'No ping for 320s',
          gracePeriodMinutes: 3,
          priority: 'YELLOW',
          status: 'ACTIVE',
          source: 'SIMULATED',
          timestamp: '10:12:00',
          energyImpactKw: 0,
          triageStatus: 'New',
          note: 'demo data',
        });
      }
      return latency({
        name: 'Sensor Node Offline',
        description: 'ESP8266 multi-sensor gateway in Room 204 dropped telemetry heartbeat.',
        affectedRooms: roomsStore,
        note: 'demo data',
      });
    } else if (scenarioId === 'camera-offline') {
      if (r204) {
        r204.status = 'attention';
        r204.priority = 'YELLOW';
      }
      const existing = alertsStore.find((a) => a.id === 'ALT-SCN-CAM-OFFLINE');
      if (!existing) {
        alertsStore.unshift({
          id: 'ALT-SCN-CAM-OFFLINE',
          roomId: 'room-204',
          roomName: 'Lecture Hall 204',
          block: 'CSE Block',
          title: 'Vision node CAM-204 stream disconnected',
          description: 'Camera node dropped RTSP frame feed. Campus Intelligence running in degraded mode on IR / motion sensor.',
          expectedState: '15 FPS RTSP stream active',
          observedState: '0 FPS (Connection refused)',
          gracePeriodMinutes: 1,
          priority: 'YELLOW',
          status: 'ACTIVE',
          source: 'SIMULATED',
          timestamp: '10:08:00',
          energyImpactKw: 0,
          triageStatus: 'New',
          note: 'demo data',
        });
      }
      return latency({
        name: 'Camera Vision Node Offline',
        description: 'Camera node inference node dropped frame stream. Triage downgraded to secondary IR / motion sensor.',
        affectedRooms: roomsStore,
        note: 'demo data',
      });
    } else if (scenarioId === 'energy-waste') {
      if (r204) {
        r204.observedHeadcount = 0;
        r204.expectedOccupancy = 0;
        r204.motionDetected = false;
        r204.energyKw = 3.9;
        r204.status = 'review';
        r204.priority = 'ORANGE';
        r204.classState = 'UNCONFIRMED_ACTIVITY';
        r204.lightStatus = 'ON';
        r204.hvacStatus = 'ON';
      }
      const existing = alertsStore.find((a) => a.id === 'ALT-SCN-ENERGY-WASTE');
      if (!existing) {
        alertsStore.unshift({
          id: 'ALT-SCN-ENERGY-WASTE',
          roomId: 'room-204',
          roomName: 'Lecture Hall 204',
          block: 'CSE Block',
          title: 'Energy-waste opportunity: 3.9 kW load in vacant hall',
          description: '3.9 kW load detected in vacant Room 204 for >25 minutes with zero occupancy. Automated setback recommended.',
          expectedState: 'Setback mode (<0.5 kW)',
          observedState: 'Full load 3.9 kW active',
          gracePeriodMinutes: 15,
          priority: 'ORANGE',
          status: 'ACTIVE',
          source: 'SIMULATED',
          timestamp: '10:16:00',
          energyImpactKw: 3.9,
          triageStatus: 'New',
          note: 'demo data',
        });
      }
      return latency({
        name: 'Energy-Waste Opportunity Identified',
        description: 'Vacant lecture hall drawing 3.9 kW lights & HVAC for >25 min. High-impact setback opportunity.',
        affectedRooms: roomsStore,
        note: 'demo data',
      });
    } else if (scenarioId === 'emergency-request') {
      if (r204) {
        r204.status = 'critical';
        r204.priority = 'RED';
        r204.classState = 'DISPATCH_ALERT';
      }
      const existing = alertsStore.find((a) => a.id === 'ALT-SCN-EMERGENCY');
      if (!existing) {
        alertsStore.unshift({
          id: 'ALT-SCN-EMERGENCY',
          roomId: 'room-204',
          roomName: 'Lecture Hall 204',
          block: 'CSE Block',
          title: 'Emergency dispatch: Medical assistance SOS',
          description: 'Emergency assistance request triggered from Room 204 console. First aid responders alerted.',
          expectedState: 'Normal secured operation',
          observedState: 'SOS beacon engaged',
          gracePeriodMinutes: 0,
          priority: 'RED',
          status: 'ACTIVE',
          source: 'SIMULATED',
          timestamp: '10:18:00',
          energyImpactKw: 0,
          triageStatus: 'New',
          note: 'demo data',
        });
      }
      return latency({
        name: 'Emergency Dispatch Activated',
        description: 'SOS panic beacon triggered at Room 204. Critical RED priority dispatch to campus security & first aid.',
        affectedRooms: roomsStore,
        note: 'demo data',
      });
    } else if (scenarioId === 'automated-setback-success') {
      if (r204) {
        r204.lightStatus = 'OFF';
        r204.hvacStatus = 'SETBACK';
        r204.energyKw = 0.4;
        r204.status = 'normal';
        r204.priority = 'GREEN';
        r204.classState = 'VACANT_SETBACK';
      }
      return latency({
        name: 'Automated Energy Setback Applied',
        description: 'Setback algorithm reduced Room 204 consumption from 3.6 kW to 0.4 kW (89% reduction).',
        affectedRooms: roomsStore,
        note: 'demo data',
      });
    } else if (scenarioId === 'perimeter-trip') {
      const lab1 = roomsStore.find((r) => r.id === 'room-lab-ai-01');
      if (lab1) {
        lab1.status = 'critical';
        lab1.priority = 'RED';
      }
      return latency({
        name: 'Perimeter Safety Hardware Alert',
        description: 'Egress contact interrupted in LAB-AI-01.',
        affectedRooms: roomsStore,
        note: 'demo data',
      });
    } else {
      // reset to baseline
      if (r204) {
        r204.observedHeadcount = 0;
        r204.expectedOccupancy = 60;
        r204.motionDetected = false;
        r204.energyKw = 0.82;
        r204.status = 'review';
        r204.priority = 'ORANGE';
        r204.classState = 'UNCONFIRMED_ACTIVITY';
        r204.lightStatus = 'ON';
        r204.hvacStatus = 'ON';
      }
      return latency({
        name: 'Baseline Operational State',
        description: 'Standard campus telemetry baseline restored for Room 204 and all campus spaces.',
        affectedRooms: roomsStore,
        note: 'demo data',
      });
    }
  },

  // Legacy helper for specimen data
  async getSpecimenData(): Promise<DesignSpecimenData> {
    const metrics: MetricItem[] = [
      {
        id: 'm-1',
        label: 'Total Facility Power',
        value: '17.8',
        unit: 'kW',
        delta: { value: '-4.2 kW', trend: 'down', isPositive: true },
        source: 'SIMULATED',
        subtext: 'Campus Sub-Station Meter A-4',
      },
      {
        id: 'm-2',
        label: 'Telemetry Heartbeats',
        value: '128/132',
        unit: 'nodes',
        delta: { value: '97.0%', trend: 'neutral', isPositive: true },
        source: 'SIMULATED',
        subtext: 'Edge Raspberry Pi Clusters',
      },
      {
        id: 'm-3',
        label: 'Unoccupied Power Draw',
        value: '5.20',
        unit: 'kW',
        delta: { value: '+1.8 kW', trend: 'up', isPositive: false },
        source: 'SIMULATED',
        subtext: 'Room 204 & 102 circuit draw',
      },
      {
        id: 'm-4',
        label: 'Estimated Daily Waste',
        value: '24.3',
        unit: 'kWh',
        delta: { value: 'SDG 11 Target: <40', trend: 'down', isPositive: true },
        source: 'SIMULATED',
        subtext: 'Heuristic model based on schedule delta',
      },
    ];

    return latency({
      metrics,
      alerts: [...alertsStore],
      timeline: eventsStore.map((e) => ({
        id: e.id,
        timestamp: e.timestamp,
        title: e.type,
        detail: e.explanation,
        status: e.priority === 'GREEN' ? 'normal' : e.priority === 'YELLOW' ? 'attention' : e.priority === 'ORANGE' ? 'review' : 'critical',
        source: e.source as DataSourceType,
        actor: e.actor || 'Campus Engine',
        note: 'demo data',
      })),
      rooms: roomsStore.map((r) => ({
        id: r.id,
        roomCode: r.number,
        floor: r.floor,
        department: r.block,
        capacity: r.capacity,
        expectedOccupancy: r.expectedOccupancy,
        observedOccupancy: r.observedHeadcount,
        motionDetected: r.motionDetected,
        hvacPowerKw: r.energyKw,
        lightingStatus: r.lightStatus,
        status: r.status,
        source: r.source,
        lastUpdated: '10:18:22',
        note: 'demo data',
      })),
      systemHealth: {
        connectedNodes: 132,
        piNodesActive: 128,
        edgeSensorsOnline: 396,
        ingestRateSec: 48,
        lastHeartbeat: '2026-10-07 10:18:22',
        source: 'SIMULATED' as DataSourceType,
      },
    });
  },

  // 16. getHourlyEnergy
  async getHourlyEnergy(timeframe: 'Today' | 'Week' = 'Today'): Promise<import('../types').EnergyHourlyPoint[]> {
    const data = timeframe === 'Week' ? HOURLY_ENERGY_WEEK : HOURLY_ENERGY_TODAY;
    return latency(data);
  },

  // 17. getFloorPlanNodes
  async getFloorPlanNodes(): Promise<import('../types').FloorRoomNode[]> {
    return latency([...CSE_FLOOR_2_NODES]);
  },

  // 18. postVisionEvent
  async postVisionEvent(event: VisionEventRequest): Promise<VisionEventResponse> {
    const room = roomsStore.find((r) => r.id === event.roomId);
    if (room) {
      room.observedHeadcount = event.observedHeadcount;
      room.source = 'SIMULATED';
      room.motionDetected = event.observedHeadcount > 0;
    }
    return latency({
      status: 'recorded',
      eventId: `evt-vis-${Date.now()}`,
      stateReconciled: true,
    });
  },

  // 19. postEdgeSensor
  async postEdgeSensor(reading: EdgeSensorTelemetryRequest): Promise<EdgeSensorTelemetryResponse> {
    const room = roomsStore.find((r) => r.id === reading.roomId);
    if (room && reading.type === 'PIR_MOTION') {
      room.motionDetected = Boolean(reading.value);
    } else if (room && reading.type === 'POWER_CURRENT' && typeof reading.value === 'number') {
      room.energyKw = reading.value;
    }
    return latency({
      status: 'ok',
      readingId: `read-${Date.now()}`,
    });
  },

  // 20. postEdgeHeartbeat
  async postEdgeHeartbeat(heartbeat: EdgeHeartbeatRequest): Promise<EdgeHeartbeatResponse> {
    const dev = devicesStore.find((d) => d.deviceId === heartbeat.deviceId);
    if (dev) {
      dev.lastPing = 'Just now';
      dev.status = heartbeat.status || 'ONLINE';
    }
    return latency({
      status: 'pong',
      receivedAt: new Date().toISOString(),
    });
  },
};

// Real hardware PI reading listener for live telemetry ingestion
let piReadingListener: (() => void) | null = null;

export function setPiReadingListener(listener: (() => void) | null) {
  piReadingListener = listener;
}

export function recordPiReading(): void {
  piReadingListener?.();
}

/**
 * HttpClient implementation of ApiClient.
 * Points to the REST API /api routes defined in docs/API.md.
 * Automatically active when VITE_DATA_MODE is 'http' or 'real'.
 */
export class HttpClient implements ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...((options?.headers as Record<string, string>) || {}),
    };

    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`API error ${res.status}: ${errBody || res.statusText}`);
    }
    return (await res.json()) as T;
  }

  async getRooms(blockFilter?: string): Promise<Room[]> {
    const query = blockFilter && blockFilter !== 'ALL' ? `?block=${encodeURIComponent(blockFilter)}` : '';
    const res = await this.request<{ data: Room[] }>(`/rooms${query}`);
    return res.data || [];
  }

  async getRoom(roomId: string): Promise<Room | null> {
    return this.request<Room>(`/rooms/${encodeURIComponent(roomId)}`);
  }

  async getClassroomStatus(): Promise<ClassroomStatusItem[]> {
    const res = await this.request<{ classrooms: ClassroomStatusItem[] }>('/classrooms/status');
    return res.classrooms || [];
  }

  async getTimetable(roomId?: string): Promise<TimetableEntry[]> {
    const query = roomId ? `?roomId=${encodeURIComponent(roomId)}` : '';
    const res = await this.request<{ data: TimetableEntry[] }>(`/timetable${query}`);
    return res.data || [];
  }

  async getOccupancy(roomId?: string): Promise<OccupancyReading[]> {
    const query = roomId ? `?roomId=${encodeURIComponent(roomId)}` : '';
    const res = await this.request<{ data: OccupancyReading[] }>(`/occupancy${query}`);
    return res.data || [];
  }

  async getSensors(roomId?: string): Promise<SensorReading[]> {
    const query = roomId ? `?roomId=${encodeURIComponent(roomId)}` : '';
    const res = await this.request<{ data: SensorReading[] }>(`/sensors${query}`);
    return res.data || [];
  }

  async getEvents(): Promise<CampusEvent[]> {
    const res = await this.request<{ data: CampusEvent[] }>('/events');
    return res.data || [];
  }

  async getAlerts(priorityFilter?: PriorityLevel): Promise<Alert[]> {
    const query = priorityFilter ? `?priority=${encodeURIComponent(priorityFilter)}` : '';
    const res = await this.request<{ data: Alert[] }>(`/alerts${query}`);
    return res.data || [];
  }

  async acknowledgeAlert(id: string): Promise<{ success: boolean; alert: Alert }> {
    return this.request<{ success: boolean; alert: Alert }>(`/alerts/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'Acknowledge' }),
    });
  }

  async resolveAlert(id: string, note?: string): Promise<{ success: boolean; alert: Alert }> {
    return this.request<{ success: boolean; alert: Alert }>(`/alerts/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'Resolve', note }),
    });
  }

  async assignAlert(id: string, assignee: string): Promise<{ success: boolean; alert: Alert }> {
    return this.request<{ success: boolean; alert: Alert }>(`/alerts/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'Assign', assignee }),
    });
  }

  async updateAlertStatus(id: string, status: AlertStatus, note?: string): Promise<{ success: boolean; alert: Alert }> {
    return this.request<{ success: boolean; alert: Alert }>(`/alerts/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    });
  }

  async bulkUpdateAlerts(
    ids: string[],
    action: 'Acknowledge' | 'Resolve' | 'Assign',
    assignee?: string,
    note?: string
  ): Promise<{ success: boolean; alerts: Alert[] }> {
    return this.request<{ success: boolean; alerts: Alert[] }>('/alerts/bulk', {
      method: 'PATCH',
      body: JSON.stringify({ ids, action, assignee, note }),
    });
  }

  async getDevices(): Promise<EdgeDevice[]> {
    const res = await this.request<{ data: EdgeDevice[] }>('/devices');
    return res.data || [];
  }

  async createEmergency(request: {
    requesterName: string;
    requesterRole: 'Student' | 'Faculty' | 'Staff' | 'Admin / HOD';
    locationRoomId: string;
    locationDetail: string;
    type: 'MEDICAL' | 'PERIMETER' | 'INFRASTRUCTURE' | 'FIRE_HAZARD';
    notes: string;
  }): Promise<EmergencyRequest> {
    return this.request<EmergencyRequest>('/emergency', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getEnergySummary(): Promise<EnergySummary> {
    return this.request<EnergySummary>('/energy/summary');
  }

  async askAssistant(
    query: string,
    options?: { degradedMode?: boolean }
  ): Promise<AssistantResponse> {
    return this.request<AssistantResponse>('/ai/ask', {
      method: 'POST',
      body: JSON.stringify({ query, degradedMode: options?.degradedMode }),
    });
  }

  async runScenario(scenarioId: string): Promise<{
    name: string;
    description: string;
    affectedRooms: Room[];
    note: string;
  }> {
    return this.request<{
      name: string;
      description: string;
      affectedRooms: Room[];
      note: string;
    }>('/scenarios/run', {
      method: 'POST',
      body: JSON.stringify({ scenarioId }),
    });
  }

  async getSpecimenData(): Promise<DesignSpecimenData> {
    return this.request<DesignSpecimenData>('/specimen');
  }

  async getHourlyEnergy(timeframe?: 'Today' | 'Week'): Promise<import('../types').EnergyHourlyPoint[]> {
    return this.request<import('../types').EnergyHourlyPoint[]>(`/energy/hourly?timeframe=${timeframe || 'Today'}`);
  }

  async getFloorPlanNodes(): Promise<import('../types').FloorRoomNode[]> {
    return this.request<import('../types').FloorRoomNode[]>('/floorplan/nodes');
  }

  async postVisionEvent(event: VisionEventRequest): Promise<VisionEventResponse> {
    const res = await this.request<VisionEventResponse>('/vision/events', {
      method: 'POST',
      body: JSON.stringify(event),
    });
    return res;
  }

  async postEdgeSensor(reading: EdgeSensorTelemetryRequest): Promise<EdgeSensorTelemetryResponse> {
    const res = await this.request<EdgeSensorTelemetryResponse>('/edge/sensors', {
      method: 'POST',
      body: JSON.stringify(reading),
    });
    return res;
  }

  async postEdgeHeartbeat(heartbeat: EdgeHeartbeatRequest): Promise<EdgeHeartbeatResponse> {
    const res = await this.request<EdgeHeartbeatResponse>('/edge/heartbeat', {
      method: 'POST',
      body: JSON.stringify(heartbeat),
    });
    return res;
  }
}

// Instantiate clients
export const httpClient = new HttpClient();

/**
 * Determine data mode from VITE_DATA_MODE environment variable:
 * - 'http' or 'real' -> HttpClient
 * - 'mock' or default -> MockClient
 */
const DATA_MODE_ENV = ((import.meta as any).env?.VITE_DATA_MODE || 'mock').toLowerCase();

export const isRealBackendMode = DATA_MODE_ENV === 'http' || DATA_MODE_ENV === 'real';

// Single source of truth exported API instance, switched by VITE_DATA_MODE
export const api: ApiClient = isRealBackendMode ? httpClient : mockClient;

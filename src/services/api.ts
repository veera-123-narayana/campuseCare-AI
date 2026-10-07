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
} from '../types';

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
    source: 'PI',
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
    source: 'PI',
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
    source: 'LIVE',
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
    source: 'LIVE',
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
    source: 'LIVE',
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
    source: 'LIVE',
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
    source: 'PI',
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
    roomName: 'Lecture Theatre 204',
    block: 'CSE Block',
    title: 'Classroom activity not confirmed',
    description:
      'Timetable registers Artificial Intelligence (CSE-A, 10:00-11:00, capacity 60). Camera headcount reads 0 and PIR motion sensor registers no activity past the 15-minute grace threshold. High-bay lights and HVAC remain energized at 3.4 kW.',
    expectedState: 'Artificial Intelligence · 60 seats expected',
    observedState: 'Headcount 0 · IR motion idle · 3.4 kW',
    gracePeriodMinutes: 15,
    priority: 'ORANGE',
    status: 'ACTIVE',
    source: 'LIVE',
    timestamp: '10:18:22',
    energyImpactKw: 3.4,
    note: 'demo data',
  },
  {
    id: 'ALT-102',
    roomId: 'room-102',
    roomName: 'Seminar Room 102',
    block: 'Main Block',
    title: 'Unscheduled electrical load registered',
    description:
      'Room has no active booking in timetable database. Smart sub-meter registers lighting circuit active at 1.8 kW.',
    expectedState: 'Unscheduled / Vacant',
    observedState: 'Headcount 0 · Load 1.8 kW active',
    gracePeriodMinutes: 10,
    priority: 'YELLOW',
    status: 'ACTIVE',
    source: 'PI',
    timestamp: '10:05:40',
    energyImpactKw: 1.8,
    note: 'demo data',
  },
  {
    id: 'ALT-LAB-01',
    roomId: 'room-lab-ai-01',
    roomName: 'AI & Robotics Hub 01',
    block: 'CSE Block',
    title: 'Emergency perimeter hardware alert',
    description:
      'Secondary egress door magnetic contact interrupted outside scheduled lab hours. PIR sensor detected localized motion near server rack.',
    expectedState: 'Secured Perimeter / Access Card Controlled',
    observedState: 'Door contact open · 1 person detected',
    gracePeriodMinutes: 0,
    priority: 'RED',
    status: 'ACTIVE',
    source: 'LIVE',
    timestamp: '10:14:15',
    energyImpactKw: 0,
    note: 'demo data',
  },
  {
    id: 'ALT-201',
    roomId: 'room-201',
    roomName: 'Smart Classroom 201',
    block: 'CSE Block',
    title: 'Optimal occupancy balance verified',
    description:
      'Timetable matches observed count (50 expected vs 48 observed). Automated airflow modulation engaged.',
    expectedState: 'CS-201 (50 expected)',
    observedState: 'Headcount 48 · Optimal',
    gracePeriodMinutes: 15,
    priority: 'GREEN',
    status: 'RESOLVED',
    source: 'LIVE',
    timestamp: '09:20:00',
    energyImpactKw: -0.8,
    note: 'demo data',
  },
];

let devicesStore: EdgeDevice[] = [
  {
    id: 'dev-1',
    deviceId: 'PI-CAM-204',
    name: 'Ceiling Camera Headcount Node',
    type: 'PI_CAMERA',
    roomId: 'room-204',
    status: 'ONLINE',
    ipAddress: '10.24.12.204',
    lastPing: '2s ago',
    firmwareVersion: 'v2.4.1-edge',
    source: 'PI',
    note: 'demo data',
  },
  {
    id: 'dev-2',
    deviceId: 'ESP32-PIR-204',
    name: 'Dual PIR Motion Sensor',
    type: 'ESP32_PIR',
    roomId: 'room-204',
    status: 'ONLINE',
    ipAddress: '10.24.12.205',
    lastPing: '1s ago',
    firmwareVersion: 'v1.1.0-esp',
    source: 'ESP32',
    note: 'demo data',
  },
  {
    id: 'dev-3',
    deviceId: 'CT-SUB-204',
    name: 'Current Transformer Power Meter',
    type: 'CURRENT_TRANSFORMER',
    roomId: 'room-204',
    status: 'ONLINE',
    ipAddress: '10.24.10.42',
    lastPing: '3s ago',
    firmwareVersion: 'v3.0.0-modbus',
    source: 'PI',
    note: 'demo data',
  },
  {
    id: 'dev-4',
    deviceId: 'PI-GW-CSE-02',
    name: 'Floor 2 Subnet Gateway Pi 5',
    type: 'PI_GATEWAY',
    roomId: 'room-202',
    status: 'ONLINE',
    ipAddress: '10.24.12.1',
    lastPing: '500ms ago',
    firmwareVersion: 'v4.1.2-gw',
    source: 'PI',
    note: 'demo data',
  },
  {
    id: 'dev-5',
    deviceId: 'ESP32-MAG-LAB01',
    name: 'Magnetic Egress Reed Switch',
    type: 'ESP32_PIR',
    roomId: 'room-lab-ai-01',
    status: 'DEGRADED',
    ipAddress: '10.24.15.11',
    lastPing: '10s ago',
    firmwareVersion: 'v1.0.8',
    source: 'ESP32',
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
    source: 'LIVE',
    note: 'demo data',
  },
];

let eventsStore: CampusEvent[] = [
  {
    id: 'evt-101',
    type: 'OCCUPANCY_DISCREPANCY',
    source: 'LIVE',
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
    source: 'PI',
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
    source: 'PI',
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
    source: 'PI',
    roomId: 'room-202',
    priority: 'GREEN',
    confidence: 0.99,
    explanation: 'Floor 2 Subnet Gateway Pi 5 published 42 sensor packets with 0 dropped frames.',
    recommendedAction: 'Nominal telemetry ingest rate verified.',
    status: 'RESOLVED',
    timestamp: '09:30:12',
    note: 'demo data',
  },
  {
    id: 'evt-106',
    type: 'OCCUPANCY_CONFIRMED',
    source: 'LIVE',
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
    source: 'PI',
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
    source: 'LIVE',
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
  { time: '06:00', actualKw: 4.2, baselineKw: 8.5, unoccupiedWasteKw: 0.4, source: 'LIVE' },
  { time: '07:00', actualKw: 6.8, baselineKw: 12.0, unoccupiedWasteKw: 0.8, source: 'LIVE' },
  { time: '08:00', actualKw: 14.5, baselineKw: 22.0, unoccupiedWasteKw: 1.2, source: 'LIVE' },
  { time: '09:00', actualKw: 19.8, baselineKw: 26.5, unoccupiedWasteKw: 2.4, source: 'LIVE' },
  { time: '10:00', actualKw: 17.8, baselineKw: 28.5, unoccupiedWasteKw: 5.2, source: 'LIVE' },
  { time: '11:00', actualKw: 15.2, baselineKw: 27.0, unoccupiedWasteKw: 4.1, source: 'LIVE' },
  { time: '12:00', actualKw: 11.4, baselineKw: 20.0, unoccupiedWasteKw: 2.8, source: 'SIMULATED' },
  { time: '13:00', actualKw: 13.6, baselineKw: 22.5, unoccupiedWasteKw: 3.0, source: 'SIMULATED' },
  { time: '14:00', actualKw: 18.2, baselineKw: 27.0, unoccupiedWasteKw: 3.5, source: 'SIMULATED' },
  { time: '15:00', actualKw: 16.5, baselineKw: 25.5, unoccupiedWasteKw: 2.9, source: 'SIMULATED' },
  { time: '16:00', actualKw: 12.8, baselineKw: 21.0, unoccupiedWasteKw: 1.8, source: 'SIMULATED' },
  { time: '17:00', actualKw: 8.2, baselineKw: 15.0, unoccupiedWasteKw: 1.0, source: 'SIMULATED' },
];

const HOURLY_ENERGY_WEEK: import('../types').EnergyHourlyPoint[] = [
  { time: 'Mon', actualKw: 16.4, baselineKw: 26.0, unoccupiedWasteKw: 4.2, source: 'LIVE' },
  { time: 'Tue', actualKw: 18.1, baselineKw: 27.5, unoccupiedWasteKw: 4.8, source: 'LIVE' },
  { time: 'Wed', actualKw: 17.8, baselineKw: 28.5, unoccupiedWasteKw: 5.2, source: 'LIVE' },
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
    source: 'LIVE',
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
    source: 'LIVE',
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
    source: 'PI',
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
    source: 'LIVE',
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
    source: 'PI',
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
    source: 'PI',
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
    source: 'LIVE',
  },
];

// Exported typed API functions
export const api = {
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
        source: 'ESP32',
        roomId: room.id,
        type: 'PIR_MOTION',
        value: room.motionDetected,
        unit: 'state',
        timestamp: 'Just now',
        note: 'demo data',
      },
      {
        deviceId: `CAM-${room.number}`,
        source: 'PI',
        roomId: room.id,
        type: 'CAMERA_HEADCOUNT',
        value: room.observedHeadcount,
        unit: 'persons',
        timestamp: '1s ago',
        note: 'demo data',
      },
      {
        deviceId: `PWR-${room.number}`,
        source: 'PI',
        roomId: room.id,
        type: 'POWER_CURRENT',
        value: room.energyKw,
        unit: 'kW',
        timestamp: '1s ago',
        note: 'demo data',
      },
      {
        deviceId: `TEMP-${room.number}`,
        source: 'ESP32',
        roomId: room.id,
        type: 'TEMPERATURE',
        value: 23.4,
        unit: '°C',
        timestamp: '3s ago',
        note: 'demo data',
      },
      {
        deviceId: `DOOR-${room.number}`,
        source: 'ESP32',
        roomId: room.id,
        type: 'DOOR_CONTACT',
        value: room.status === 'critical' ? 'OPEN' : 'CLOSED',
        unit: 'status',
        timestamp: '5s ago',
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
    }
    return latency({ success: true, alert: alert! });
  },

  // 9. resolveAlert
  async resolveAlert(id: string): Promise<{ success: boolean; alert: Alert }> {
    const alert = alertsStore.find((a) => a.id === id);
    if (alert) {
      alert.status = 'RESOLVED';
    }
    return latency({ success: true, alert: alert! });
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
      source: 'LIVE',
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
      source: 'LIVE',
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
      source: 'LIVE',
      note: 'demo data',
    };
    return latency(summary);
  },

  // 13. askAssistant
  async askAssistant(query: string): Promise<{
    answer: string;
    suggestedActions: string[];
    relevantRooms: string[];
    source: DataSourceType;
    note: string;
  }> {
    const lower = query.toLowerCase();
    let answer =
      'CAMPUSCARE has analyzed timetable allocations against edge Raspberry Pi sensor feeds. Currently, Room 204 has active unconfirmed activity (0 headcount vs 60 scheduled, 3.4 kW draw) which qualifies for automated energy setback.';
    let suggestedActions = ['Review Room 204 Setback', 'Inspect Edge Pi Camera 204', 'View Energy Waste'];
    let relevantRooms = ['room-204'];

    if (lower.includes('emergency') || lower.includes('safety') || lower.includes('door') || lower.includes('egress')) {
      answer =
        'Emergency perimeter dispatch is currently open for LAB-AI-01 where secondary egress contacts were opened. Facilities desk and campus security have received automated dispatch telemetry.';
      suggestedActions = ['View Emergency Log', 'Inspect LAB-AI-01 Sensors', 'Clear Dispatch'];
      relevantRooms = ['room-lab-ai-01'];
    } else if (lower.includes('sdg') || lower.includes('sustainability') || lower.includes('energy') || lower.includes('power')) {
      answer =
        'CAMPUSCARE has prevented an estimated 48.7 kg of CO₂ emissions today under UN SDG 11.6 by initiating automatic setbacks in vacant rooms past grace windows. Current unoccupied waste is 5.2 kW.';
      suggestedActions = ['View Sustainability Dashboard', 'Simulate Setback Routine'];
      relevantRooms = ['room-204', 'room-102'];
    } else if (lower.includes('204') || lower.includes('artificial intelligence') || lower.includes('cs-a')) {
      answer =
        'Room 204 is scheduled for Artificial Intelligence (CSE-A, 10:00-11:00, 60 students). Camera headcount reads 0 and motion is idle past the 15-minute grace threshold. Operational recommendation: engage HVAC setback.';
      suggestedActions = ['Trigger Setback Routine', 'Acknowledge Discrepancy'];
      relevantRooms = ['room-204'];
    }

    return latency({
      answer,
      suggestedActions,
      relevantRooms,
      source: 'SIMULATED',
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
    if (scenarioId === 'empty-lecture-waste') {
      // simulate Room 204 lecture cancelled with high load
      const r204 = roomsStore.find((r) => r.id === 'room-204');
      if (r204) {
        r204.observedHeadcount = 0;
        r204.motionDetected = false;
        r204.energyKw = 3.6;
        r204.status = 'review';
        r204.priority = 'ORANGE';
        r204.classState = 'UNCONFIRMED_ACTIVITY';
      }
      return latency({
        name: 'Unconfirmed Class Activity with High Circuit Load',
        description: 'Room 204 has 60 expected students, 0 observed, lights & AC drawing 3.6 kW past grace threshold.',
        affectedRooms: roomsStore,
        note: 'demo data',
      });
    } else if (scenarioId === 'automated-setback-success') {
      // simulate automatic setback applied to Room 204
      const r204 = roomsStore.find((r) => r.id === 'room-204');
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
      // reset to default baseline
      return latency({
        name: 'Baseline Operational State',
        description: 'Standard campus telemetry baseline restored.',
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
        source: 'LIVE',
        subtext: 'Campus Sub-Station Meter A-4',
      },
      {
        id: 'm-2',
        label: 'Telemetry Heartbeats',
        value: '128/132',
        unit: 'nodes',
        delta: { value: '97.0%', trend: 'neutral', isPositive: true },
        source: 'PI',
        subtext: 'Edge Raspberry Pi Clusters',
      },
      {
        id: 'm-3',
        label: 'Unoccupied Power Draw',
        value: '5.20',
        unit: 'kW',
        delta: { value: '+1.8 kW', trend: 'up', isPositive: false },
        source: 'LIVE',
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
        source: 'PI' as DataSourceType,
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
};

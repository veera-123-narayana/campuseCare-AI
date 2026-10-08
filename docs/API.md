# CAMPUSCARE REST API Contract & Telemetry Specification

Version: `1.0.0`  
Protocol: `HTTP/1.1`, `HTTPS`, `WebSocket (WSS)`  
Base URL: `/api`  
Data Modes: `mock` (In-memory edge mock), `http` (Live FastAPI/Node.js telemetry bridge via `VITE_DATA_MODE=http`)

---

## 1. Authentication & Security
- **Bearer Token**: Standard `Authorization: Bearer <token>` header for operator mutations.
- **Zero Client-Side API Keys**: AI Assistant, Vision nodes, and Edge sensors communicate through backend reverse proxies. Client browser code never embeds LLM API keys or cloud credentials.

---

## 2. Endpoints Overview

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/rooms` | Retrieve all campus spaces and telemetry summaries |
| `GET` | `/api/classrooms/status` | Real-time operational classroom status matrix |
| `GET` | `/api/alerts` | Active and historical discrepancies queue |
| `PATCH` | `/api/alerts/:id` | Triage alert (acknowledge, assign, resolve) |
| `POST` | `/api/vision/events` | Ingest edge camera headcount & occupancy inferences |
| `POST` | `/api/edge/sensors` | Ingest IoT sensor telemetry (PIR motion, temp, CT power) |
| `POST` | `/api/edge/heartbeat` | Ingest edge gateway/node health ping |
| `POST` | `/api/emergency` | Dispatch rapid emergency responder assistance |
| `POST` | `/api/ai/ask` | Query campus assistant with tool-call trace |

---

## 3. REST Contract Specifications

### 3.1 `GET /api/rooms`
Query campus rooms with optional department/block filtering.

- **Query Parameters**:
  - `block` (optional): Filter by block (e.g., `CSE Block`, `Main Block`)
- **Response `200 OK`**:
```json
{
  "data": [
    {
      "id": "room-204",
      "number": "204",
      "name": "Lecture Hall 204",
      "block": "CSE Block",
      "floor": "Level 2",
      "capacity": 60,
      "status": "review",
      "priority": "ORANGE",
      "hvacStatus": "ON",
      "lightStatus": "ON",
      "expectedOccupancy": 60,
      "observedHeadcount": 0,
      "motionDetected": false,
      "energyKw": 3.4,
      "source": "LIVE",
      "classState": "UNCONFIRMED_ACTIVITY",
      "note": "demo data"
    }
  ],
  "total": 1,
  "timestamp": "2026-10-08T10:18:22Z"
}
```

---

### 3.2 `GET /api/classrooms/status`
Real-time classroom state, combining vision headcount, schedule expectation, and active electrical load.

- **Response `200 OK`**:
```json
{
  "classrooms": [
    {
      "roomId": "room-204",
      "roomNumber": "204",
      "name": "Lecture Hall 204",
      "block": "CSE Block",
      "floor": "Level 2",
      "status": "review",
      "priority": "ORANGE",
      "classState": "UNCONFIRMED_ACTIVITY",
      "expectedOccupancy": 60,
      "observedHeadcount": 0,
      "currentClass": "Artificial Intelligence (AI-401)",
      "timeSlot": "10:00 - 11:00",
      "powerKw": 3.4,
      "source": "LIVE",
      "gracePeriodRemainingSec": 0
    }
  ],
  "timestamp": "2026-10-08T10:18:22Z"
}
```

---

### 3.3 `GET /api/alerts`
Fetch operational alerts queue with priority and status filters.

- **Query Parameters**:
  - `priority` (optional): `GREEN` | `YELLOW` | `ORANGE` | `RED`
  - `status` (optional): `ACTIVE` | `ACKNOWLEDGED` | `RESOLVED`
- **Response `200 OK`**:
```json
{
  "data": [
    {
      "id": "ALT-204",
      "roomId": "room-204",
      "roomName": "Lecture Hall 204",
      "title": "Class commencement review",
      "description": "Unconfirmed attendance past 10-minute grace period.",
      "priority": "ORANGE",
      "status": "ACTIVE",
      "triageStatus": "New",
      "source": "LIVE",
      "energyImpactKw": 3.4,
      "timestamp": "10:10:00"
    }
  ],
  "count": 1
}
```

---

### 3.4 `PATCH /api/alerts/:id`
Triage or mutate alert state.

- **Path Parameters**:
  - `id`: Alert identifier (e.g. `ALT-204`)
- **Request Body**:
```json
{
  "action": "Acknowledge",
  "assignee": "Facilities Desk",
  "note": "Investigating HVAC setback override."
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "alert": {
    "id": "ALT-204",
    "status": "ACKNOWLEDGED",
    "triageStatus": "Acknowledged",
    "assignee": "Facilities Desk",
    "acknowledged": true,
    "timestamp": "10:12:00"
  }
}
```

---

### 3.5 `POST /api/vision/events`
Edge camera node (Raspberry Pi 5 + OpenCV / Hailo-8) reports headcount inference event.

- **Request Body**:
```json
{
  "deviceId": "PI-CAM-204",
  "roomId": "room-204",
  "observedHeadcount": 48,
  "confidence": 0.94,
  "inferenceTimeMs": 28.4,
  "timestamp": "2026-10-08T10:18:22Z"
}
```
- **Response `201 Created`**:
```json
{
  "status": "recorded",
  "eventId": "evt-vis-10293",
  "stateReconciled": true
}
```

---

### 3.6 `POST /api/edge/sensors`
Ingest sensor telemetry from ESP32 or gateway node (PIR motion, CT power clamp, temperature, door contact).

- **Request Body**:
```json
{
  "deviceId": "ESP32-PIR-204",
  "roomId": "room-204",
  "type": "PIR_MOTION",
  "value": true,
  "unit": "boolean",
  "timestamp": "2026-10-08T10:18:22Z"
}
```
- **Response `201 Created`**:
```json
{
  "status": "ok",
  "readingId": "read-94819"
}
```

---

### 3.7 `POST /api/edge/heartbeat`
Edge device ping to keep node alive in campus telemetry map.

- **Request Body**:
```json
{
  "deviceId": "PI-GW-CSE-02",
  "roomId": "room-204",
  "firmwareVersion": "v4.1.2-gw",
  "status": "ONLINE",
  "ipAddress": "10.24.12.1",
  "uptimeSec": 84920
}
```
- **Response `200 OK`**:
```json
{
  "status": "pong",
  "receivedAt": "2026-10-08T10:18:22Z"
}
```

---

### 3.8 `POST /api/emergency`
Submit immediate emergency assistance dispatch request.

- **Request Body**:
```json
{
  "type": "Medical",
  "building": "CSE Block",
  "floor": "Level 2",
  "room": "Room 204",
  "description": "Student fainted near podium.",
  "requesterName": "Dr. Suresh Varma",
  "requesterRole": "Faculty"
}
```
- **Response `201 Created`**:
```json
{
  "id": "DISP-4819",
  "status": "Requested",
  "priority": "RED",
  "timestamp": "10:18:22",
  "assignedTeam": "Campus Rapid Medical Response"
}
```

---

### 3.9 `POST /api/ai/ask`
Query campus data assistant with natural language. Generates deterministic tool-calling traces grounded in campus telemetry.

- **Request Body**:
```json
{
  "query": "Which classrooms need attention?",
  "degradedMode": false
}
```
- **Response `200 OK`**:
```json
{
  "answer": "Two classrooms currently require operator attention: Lecture Hall 204...",
  "toolCalls": [
    {
      "id": "tc-alerts",
      "tool": "getClassroomAlerts()",
      "resultSummary": "2 discrepancies active",
      "recordsCount": 2,
      "source": "LIVE"
    }
  ],
  "sourceRecords": [
    {
      "id": "room-204",
      "title": "Lecture Hall 204",
      "category": "Room",
      "source": "PI"
    }
  ],
  "suggestedActions": ["Inspect Room 204 Telemetry", "Review Perimeter Dispatch"],
  "relevantRooms": ["room-204"],
  "source": "LIVE",
  "degradedMode": false,
  "note": "demo data"
}
```

---

## 4. WebSocket Event Stream (`/api/ws/events`)
Real-time full-duplex WebSocket stream for edge sensors, camera events, alerts, and heartbeat telemetry.

- **Path**: `ws://<HOST>/api/ws/events` or `wss://<HOST>/api/ws/events`
- **Client Heartbeat**: Send `ping` every 30s.
- **Server Packet Schema**:
```json
{
  "event": "alert.created" | "room.updated" | "sensor.reading" | "device.heartbeat" | "emergency.status",
  "data": { ... },
  "timestamp": "2026-10-08T10:18:22Z"
}
```

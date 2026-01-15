# Doctor Availability Management API

This document describes the automatic availability management system for doctors, including manual toggles, meeting status updates, and automatic disconnection handling.

## Overview

The system automatically manages doctor availability in three ways:

1. **Manual Toggle**: Doctors can manually toggle their availability on/off
2. **Meeting Status**: When a doctor enters/exits a meeting, availability is automatically updated
3. **Connection Tracking**: When a doctor closes the tab/website, availability is automatically set to unavailable

## Automatic Availability Rules

- **When entering a meeting**: `isAvailable` is automatically set to `false`
- **When exiting a meeting**: `isAvailable` remains as it was (doctor must manually toggle back on)
- **When connection is lost**: `isAvailable` is automatically set to `false` (if not in a meeting)
- **When tab/website is closed**: Connection is detected as stale after 30 seconds of no heartbeat, and availability is set to `false`

## Endpoints

### 1. Toggle Availability (Manual)

**Endpoint**: `POST /api/doctor/availability/toggle`

**Authentication**: Required (Doctor only)

**Description**: Manually toggle doctor availability status.

**Request**: No body required

**Response**:
```json
{
  "message": "Doctor is now available",
  "success": true,
  "data": {
    "id": "doctor_id",
    "userid": "user_id",
    "professional_contact": "+1234567890",
    "professional_email": "doctor@example.com",
    "isAvailable": true,
    "isInMeeting": false,
    "createdAt": "2026-01-14T10:00:00.000Z",
    "updatedAt": "2026-01-14T10:00:00.000Z",
    "user": {
      "id": "user_id",
      "name": "Dr. John Doe",
      "email": "doctor@example.com",
      "image": "https://signed-url...",
      "role": "doctor"
    }
  }
}
```

### 2. Update Meeting Status

**Endpoint**: `POST /api/doctor/meeting/status`

**Authentication**: Required (Doctor only)

**Description**: Update whether the doctor is currently in a meeting. When `isInMeeting` is set to `true`, `isAvailable` is automatically set to `false`.

**Request Body**:
```json
{
  "isInMeeting": true
}
```

**Response**:
```json
{
  "message": "Doctor is now in a meeting. Availability automatically set to unavailable.",
  "success": true,
  "data": {
    "id": "doctor_id",
    "userid": "user_id",
    "professional_contact": "+1234567890",
    "professional_email": "doctor@example.com",
    "isAvailable": false,
    "isInMeeting": true,
    "createdAt": "2026-01-14T10:00:00.000Z",
    "updatedAt": "2026-01-14T10:00:00.000Z",
    "user": {
      "id": "user_id",
      "name": "Dr. John Doe",
      "email": "doctor@example.com",
      "image": "https://signed-url...",
      "role": "doctor"
    }
  }
}
```

**Usage Example**:
```typescript
// When appointment starts
await fetch('/api/doctor/meeting/status', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ isInMeeting: true })
})

// When appointment ends
await fetch('/api/doctor/meeting/status', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ isInMeeting: false })
})
```

### 3. Connection Heartbeat

**Endpoint**: `POST /api/doctor/connection/heartbeat`

**Authentication**: Required (Doctor only)

**Description**: Send a heartbeat to indicate the doctor is still connected. This should be called every 10-15 seconds while the doctor is online. If no heartbeat is received for 30 seconds, the doctor is considered disconnected and availability is automatically set to `false`.

**Request**: No body required

**Query Parameters** (optional):
- `connectionId`: Unique connection identifier (auto-generated if not provided)

**Response**:
```json
{
  "message": "Heartbeat received",
  "success": true,
  "data": {
    "timestamp": "2026-01-14T10:00:00.000Z"
  }
}
```

**Frontend Implementation**:
```typescript
// Start heartbeat interval when doctor logs in or toggles availability on
let heartbeatInterval: NodeJS.Timeout | null = null

function startHeartbeat() {
  heartbeatInterval = setInterval(async () => {
    try {
      await fetch('/api/doctor/connection/heartbeat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
    } catch (error) {
      console.error('Heartbeat failed:', error)
    }
  }, 10000) // Send heartbeat every 10 seconds
}

function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval)
    heartbeatInterval = null
  }
}

// Start heartbeat when doctor is available
// Stop heartbeat when doctor toggles off or disconnects
```

### 4. Handle Disconnection

**Endpoint**: `POST /api/doctor/connection/disconnect`

**Authentication**: Required (Doctor only)

**Description**: Explicitly handle doctor disconnection. This should be called when the doctor logs out or explicitly disconnects. Sets `isAvailable` to `false` (unless in a meeting, where it's already false).

**Request**: No body required

**Response**:
```json
{
  "message": "Disconnection handled. Availability set to unavailable.",
  "success": true,
  "data": {
    "isAvailable": false,
    "isInMeeting": false
  }
}
```

**Frontend Implementation**:
```typescript
// Call when user logs out or closes the app
window.addEventListener('beforeunload', async () => {
  // Try to send disconnect signal (may not always complete)
  navigator.sendBeacon('/api/doctor/connection/disconnect', JSON.stringify({}))
})

// Or call explicitly on logout
async function logout() {
  await fetch('/api/doctor/connection/disconnect', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  // ... rest of logout logic
}
```

## Complete Frontend Integration Example

```typescript
class DoctorAvailabilityManager {
  private heartbeatInterval: NodeJS.Timeout | null = null
  private token: string

  constructor(token: string) {
    this.token = token
  }

  // Start managing availability when doctor is online
  async start() {
    // Start heartbeat
    this.startHeartbeat()

    // Listen for page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Page is hidden, but keep heartbeat running
        // Connection will be detected as stale if heartbeat stops
      }
    })

    // Listen for beforeunload
    window.addEventListener('beforeunload', () => {
      this.handleDisconnect()
    })
  }

  // Toggle availability manually
  async toggleAvailability() {
    const response = await fetch('/api/doctor/availability/toggle', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    })
    return response.json()
  }

  // Update meeting status
  async updateMeetingStatus(isInMeeting: boolean) {
    const response = await fetch('/api/doctor/meeting/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify({ isInMeeting })
    })
    return response.json()
  }

  // Start heartbeat
  private startHeartbeat() {
    this.heartbeatInterval = setInterval(async () => {
      try {
        await fetch('/api/doctor/connection/heartbeat', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        })
      } catch (error) {
        console.error('Heartbeat failed:', error)
        this.stopHeartbeat()
      }
    }, 10000) // Every 10 seconds
  }

  // Stop heartbeat
  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  // Handle disconnection
  async handleDisconnect() {
    this.stopHeartbeat()
    try {
      // Use sendBeacon for reliability during page unload
      navigator.sendBeacon(
        '/api/doctor/connection/disconnect',
        JSON.stringify({})
      )
    } catch (error) {
      console.error('Disconnect signal failed:', error)
    }
  }

  // Cleanup
  destroy() {
    this.stopHeartbeat()
    this.handleDisconnect()
  }
}

// Usage
const availabilityManager = new DoctorAvailabilityManager(userToken)

// When doctor logs in and wants to be available
await availabilityManager.toggleAvailability() // Set to available
availabilityManager.start() // Start heartbeat and connection tracking

// When appointment starts
await availabilityManager.updateMeetingStatus(true)

// When appointment ends
await availabilityManager.updateMeetingStatus(false)

// When doctor logs out
availabilityManager.destroy()
```

## Connection Tracking Details

### Heartbeat Timeout
- **Default**: 30 seconds
- **Behavior**: If no heartbeat is received for 30 seconds, the doctor is considered disconnected
- **Action**: `isAvailable` is automatically set to `false`

### Stale Connection Check
- **Interval**: Every 10 seconds
- **Behavior**: Background job checks for stale connections and automatically handles disconnection
- **Action**: Removes connection from tracker and sets `isAvailable` to `false`

### Meeting Status Priority
- If `isInMeeting` is `true`, `isAvailable` is automatically `false`
- When exiting a meeting (`isInMeeting: false`), `isAvailable` remains as it was (doctor must manually toggle back on)

## Error Handling

All endpoints return standard error responses:

- **401 Unauthorized**: User is not authenticated
- **403 Forbidden**: User is not a doctor
- **404 Not Found**: Doctor record not found
- **500 Internal Server Error**: Server error

## Best Practices

1. **Start heartbeat immediately** when doctor toggles availability to `true`
2. **Stop heartbeat** when doctor toggles availability to `false` or logs out
3. **Update meeting status** when appointments start/end
4. **Handle page visibility** - continue heartbeat even when tab is in background
5. **Use `sendBeacon`** for disconnect signals during page unload for reliability
6. **Handle network errors** gracefully - if heartbeat fails, stop the interval

## Integration with Appointment System

When integrating with your appointment system:

```typescript
// When appointment status changes to IN_PROGRESS
async function onAppointmentStart(appointmentId: string) {
  // Update appointment status in database
  await updateAppointmentStatus(appointmentId, 'IN_PROGRESS')

  // Update doctor meeting status
  await availabilityManager.updateMeetingStatus(true)
}

// When appointment ends
async function onAppointmentEnd(appointmentId: string) {
  // Update appointment status in database
  await updateAppointmentStatus(appointmentId, 'COMPLETED')

  // Update doctor meeting status
  await availabilityManager.updateMeetingStatus(false)

  // Doctor must manually toggle availability back on if they want to be available
}
```


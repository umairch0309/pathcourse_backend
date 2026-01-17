# Agora Video Call Integration

This document describes the Agora video call token generation and management system integrated with the appointment booking system.

## Overview

The Agora integration provides secure video call functionality for appointments. Tokens are generated for both doctors and patients, allowing them to join video calls during their scheduled appointment times.

## Key Features

1. **Role-based Token Generation**: Unique tokens for doctors and patients based on appointment ID and role
2. **Time-based Access Control**: Tokens are valid 30 minutes before appointment start until 30 minutes after appointment end
3. **Appointment Duration**: Appointments are scheduled for 15 minutes from the booking time
4. **Token Reuse**: Existing valid tokens are reused to avoid unnecessary regeneration
5. **Join Tracking**: Tracks when doctors and patients join/leave the video call

## Appointment Time Structure

- **Scheduled Time** (`scheduledAt`): Set to current time when appointment is booked
- **Start Time**: Same as `scheduledAt` (appointment starts immediately when booked)
- **End Time**: `scheduledAt + 15 minutes` (15-minute appointment duration)
- **Access Window**: 30 minutes before start to 30 minutes after end

## API Endpoints

### 1. Generate/Retrieve Token

**Endpoint**: `GET /api/agora/token/{appointmentId}`

**Authentication**: Required (Doctor or Patient)

**Description**: Generate or retrieve existing Agora RTC token for joining the video call.

**Path Parameters**:
- `appointmentId`: The appointment ID

**Response**:
```json
{
  "message": "New token generated successfully",
  "token": "agora_rtc_token_string",
  "channel": "appointment_id",
  "uid": 1234567890,
  "appId": "your_agora_app_id",
  "expiry": "2026-01-14T10:45:00.000Z",
  "isExisting": false
}
```

**Error Responses**:
- `401 Unauthorized`: User not authenticated
- `403 Forbidden`: User is not authorized for this appointment
- `404 Not Found`: Appointment not found
- `400 Bad Request`: Token access window not available (too early or expired)

### 2. Validate Access Window

**Endpoint**: `GET /api/agora/validate/{appointmentId}`

**Authentication**: Not required (Public)

**Description**: Check if the appointment exists and whether the current time is within the access window.

**Path Parameters**:
- `appointmentId`: The appointment ID

**Response**:
```json
{
  "message": "Access granted",
  "isValid": true,
  "canAccess": true,
  "appointment": {
    "startTime": "2026-01-14T10:00:00.000Z",
    "endTime": "2026-01-14T10:15:00.000Z",
    "earliestAccess": "2026-01-14T09:30:00.000Z",
    "latestAccess": "2026-01-14T10:45:00.000Z"
  }
}
```

### 3. Get Token Statistics

**Endpoint**: `GET /api/agora/stats/{appointmentId}`

**Authentication**: Required (Doctor or Patient of the appointment)

**Description**: Retrieve token usage statistics, including join/leave times for both doctor and patient.

**Path Parameters**:
- `appointmentId`: The appointment ID

**Response**:
```json
{
  "message": "Token statistics retrieved successfully",
  "id": "token_id",
  "channel": "appointment_id",
  "doctorToken": "doctor_token_string",
  "patientToken": "patient_token_string",
  "doctorUid": 1123456789,
  "patientUid": 2123456789,
  "expiry": "2026-01-14T10:45:00.000Z",
  "patientJoined": "2026-01-14T10:00:05.000Z",
  "doctorJoined": "2026-01-14T10:00:10.000Z",
  "patientEnded": null,
  "doctorEnded": null,
  "joinedFirst": "patient",
  "createdAt": "2026-01-14T10:00:00.000Z"
}
```

## Token Generation Logic

### UID Generation
- **Doctor UID**: Starts with `1` + appointment hash
- **Patient UID**: Starts with `2` + appointment hash
- Ensures consistent UIDs for the same appointment and role

### Access Window Calculation
```typescript
const appointmentStartTime = appointment.scheduledAt
const appointmentEndTime = scheduledAt + 15 minutes
const earliestAccess = startTime - 30 minutes
const latestAccess = endTime + 30 minutes
```

### Token Expiry
- Tokens expire at `latestAccess` time (30 minutes after appointment ends)
- This allows for late joins and session cleanup

## Frontend Integration

### Basic Token Retrieval

```typescript
async function getAgoraToken(appointmentId: string, token: string) {
  const response = await fetch(`/api/agora/token/${appointmentId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to get token')
  }

  const data = await response.json()
  return data.data // { token, channel, uid, appId, expiry, isExisting }
}
```

### Join Video Call (Agora SDK)

```typescript
import AgoraRTC from 'agora-rtc-sdk-ng'

async function joinVideoCall(token: string, channel: string, uid: number, appId: string) {
  const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })

  await client.join(appId, channel, token, uid)

  // Set up local video/audio tracks
  const localVideoTrack = await AgoraRTC.createCameraVideoTrack()
  const localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack()

  await client.publish([localVideoTrack, localAudioTrack])

  // Handle remote users
  client.on('user-published', async (user, mediaType) => {
    await client.subscribe(user, mediaType)
    if (mediaType === 'video') {
      user.videoTrack?.play('remote-video-container')
    }
    if (mediaType === 'audio') {
      user.audioTrack?.play()
    }
  })

  return { client, localVideoTrack, localAudioTrack }
}
```

### Complete Integration Example

```typescript
class VideoCallManager {
  private client: any
  private localVideoTrack: any
  private localAudioTrack: any
  private token: string
  private appointmentId: string

  async initialize(appointmentId: string, userToken: string) {
    this.appointmentId = appointmentId

    // Get Agora token
    const tokenData = await getAgoraToken(appointmentId, userToken)
    this.token = tokenData.token

    // Join the call
    const { client, localVideoTrack, localAudioTrack } = await joinVideoCall(
      tokenData.token,
      tokenData.channel,
      tokenData.uid,
      tokenData.appId
    )

    this.client = client
    this.localVideoTrack = localVideoTrack
    this.localAudioTrack = localAudioTrack

    // Display local video
    localVideoTrack.play('local-video-container')

    // Notify backend that user joined (optional)
    await this.notifyJoin()
  }

  async leave() {
    // Notify backend that user left
    await this.notifyLeave()

    // Stop local tracks
    this.localVideoTrack?.stop()
    this.localAudioTrack?.stop()

    // Leave the channel
    await this.client?.leave()
  }

  private async notifyJoin() {
    // Optional: Call backend to track join status
    // POST /api/agora/join/{appointmentId}
  }

  private async notifyLeave() {
    // Optional: Call backend to track leave status
    // POST /api/agora/leave/{appointmentId}
  }
}
```

## Access Window Behavior

### Before Access Window
- Token generation fails with: `"Token can only be generated X minutes before the appointment starts"`
- Users must wait until 30 minutes before the scheduled time

### During Access Window
- Token generation succeeds
- Users can join the video call
- Access is granted from 30 minutes before start to 30 minutes after end

### After Access Window
- Token generation fails with: `"The appointment access window has expired"`
- Users cannot join the video call

## Environment Variables

Required environment variables for Agora integration:

```env
AGORA_APP_ID=your_agora_app_id
AGORA_CERTIFICATE_ID=your_agora_certificate_id
```

These should be added to your `.env` file and are accessed via `Bun.env.AGORA_APP_ID` and `Bun.env.AGORA_CERTIFICATE_ID`.

## Database Schema

The `AgoraToken` model stores token information:

```prisma
model AgoraToken {
  id            String      @id @default(cuid())
  channel       String      @db.VarChar(100)
  doctorToken   String?
  patientToken  String?
  doctorUid     Int?
  patientUid    Int?
  appointmentId String
  patientJoined DateTime?
  doctorJoined  DateTime?
  patientEnded  DateTime?
  doctorEnded   DateTime?
  joinedFirst   String      @db.VarChar(20)
  expiry        DateTime
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @default(now()) @updatedAt
  appointment   Appointment @relation(fields: [appointmentId], references: [id], onDelete: Cascade)
}
```

## Security Considerations

1. **Token Validation**: Tokens are validated against appointment ownership (doctor/patient)
2. **Time-based Access**: Tokens only work during the specified access window
3. **Role-based UIDs**: Different UID prefixes for doctors and patients prevent unauthorized access
4. **Token Reuse**: Existing valid tokens are reused to prevent unnecessary regeneration

## Error Handling

Common errors and solutions:

- **"Appointment not found"**: Verify the appointment ID is correct
- **"Appointment has no scheduled time"**: Ensure appointment was booked with a scheduledAt value
- **"Unauthorized: User is not the doctor/patient"**: User must be part of the appointment
- **"Token access window not available"**: Current time is outside the 30-min before to 30-min after window
- **"The appointment access window has expired"**: Appointment ended more than 30 minutes ago

## Notes

- Appointments are automatically scheduled for 15 minutes from booking time
- Access window is 30 minutes before to 30 minutes after appointment (total 75 minutes)
- Tokens are automatically cleaned up when expired (via cleanup service)
- Both doctor and patient can publish video/audio streams


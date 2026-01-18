# Session Reason API Documentation

## Overview

The Session Reason API allows doctors to submit or update the purpose/reason for a completed appointment. This helps categorize why the patient sought the session and provides valuable insights for analytics and reporting.

## Endpoint

### Submit Session Reason

**POST** `/api/appointment/{id}/session-reason`

Allows doctors to submit or update the session reason for a completed appointment.

#### Authentication

- **Required**: Yes
- **Role**: Doctor only

#### Path Parameters

| Parameter | Type   | Required | Description        |
| --------- | ------ | -------- | ------------------ |
| `id`      | string | Yes      | Appointment ID     |

#### Request Body

```json
{
  "reason": "LETTING_OFF_STEAM"
}
```

#### Request Body Schema

| Field  | Type   | Required | Description                                    | Enum Values                                                                                                                                    |
| ------ | ------ | -------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `reason` | string | Yes      | The reason/purpose for the appointment session | `LETTING_OFF_STEAM`, `TALKING_THROUGH_STRESS_OR_UNCERTAINTY`, `NEEDING_PERSPECTIVE_DURING_A_DEMANDING_PERIOD` |

#### Session Reason Types

1. **LETTING_OFF_STEAM**
   - Patient needs to vent or express frustrations
   - Used when patient wants to talk about their feelings without seeking solutions

2. **TALKING_THROUGH_STRESS_OR_UNCERTAINTY**
   - Patient is dealing with stress or uncertainty
   - Used when patient needs guidance or support during difficult times

3. **NEEDING_PERSPECTIVE_DURING_A_DEMANDING_PERIOD**
   - Patient needs perspective during a challenging period
   - Used when patient is going through a demanding situation and needs professional insight

#### Response

**Status Code**: `201 Created`

```json
{
  "message": "Session reason submitted successfully",
  "success": true,
  "data": {
    "id": "cmki7k7e40005w7kgz1hcuxu3",
    "appointmentId": "cmki7k7e40005w7kgz1hcuxu3",
    "reason": "LETTING_OFF_STEAM",
    "createdAt": "2026-01-17T11:12:28.010Z",
    "updatedAt": "2026-01-17T11:12:28.010Z"
  }
}
```

#### Response Schema

| Field         | Type   | Description                    |
| ------------- | ------ | ------------------------------ |
| `id`          | string | Session reason ID              |
| `appointmentId` | string | Associated appointment ID      |
| `reason`      | string | The session reason type        |
| `createdAt`   | string | Creation timestamp (ISO 8601)  |
| `updatedAt`   | string | Last update timestamp (ISO 8601) |

#### Error Responses

##### 401 Unauthorized

```json
{
  "message": "Unauthorized",
  "success": false
}
```

**Cause**: User is not authenticated.

##### 403 Forbidden

```json
{
  "message": "Only doctors can submit session reasons",
  "success": false
}
```

**Cause**: User is not a doctor.

```json
{
  "message": "Only the doctor can submit session reason for this appointment",
  "success": false
}
```

**Cause**: The appointment does not belong to the requesting doctor.

##### 404 Not Found

```json
{
  "message": "Appointment not found",
  "success": false
}
```

**Cause**: The appointment ID does not exist.

##### 400 Bad Request

```json
{
  "message": "Session reason can only be submitted for completed appointments",
  "success": false
}
```

**Cause**: The appointment status is not `COMPLETED`. Session reasons can only be submitted for completed appointments.

##### 500 Internal Server Error

```json
{
  "message": "Failed to submit session reason",
  "success": false
}
```

**Cause**: An unexpected server error occurred.

## Business Rules

1. **Doctor Only**: Only doctors can submit session reasons for appointments.

2. **Appointment Ownership**: Doctors can only submit session reasons for appointments where they are the assigned doctor.

3. **Completed Appointments Only**: Session reasons can only be submitted for appointments with status `COMPLETED`.

4. **Upsert Behavior**: If a session reason already exists for an appointment, submitting a new reason will update the existing record rather than creating a duplicate.

5. **One Reason Per Appointment**: Each appointment can have only one session reason. Submitting a new reason will replace the previous one.

## Usage Examples

### Example 1: Submit Session Reason for Completed Appointment

**Request:**

```bash
curl -X POST "https://api.example.com/api/appointment/cmki7k7e40005w7kgz1hcuxu3/session-reason" \
  -H "Authorization: Bearer <doctor_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "LETTING_OFF_STEAM"
  }'
```

**Response:**

```json
{
  "message": "Session reason submitted successfully",
  "success": true,
  "data": {
    "id": "session_reason_123",
    "appointmentId": "cmki7k7e40005w7kgz1hcuxu3",
    "reason": "LETTING_OFF_STEAM",
    "createdAt": "2026-01-17T11:12:28.010Z",
    "updatedAt": "2026-01-17T11:12:28.010Z"
  }
}
```

### Example 2: Update Existing Session Reason

**Request:**

```bash
curl -X POST "https://api.example.com/api/appointment/cmki7k7e40005w7kgz1hcuxu3/session-reason" \
  -H "Authorization: Bearer <doctor_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "TALKING_THROUGH_STRESS_OR_UNCERTAINTY"
  }'
```

**Response:**

```json
{
  "message": "Session reason submitted successfully",
  "success": true,
  "data": {
    "id": "session_reason_123",
    "appointmentId": "cmki7k7e40005w7kgz1hcuxu3",
    "reason": "TALKING_THROUGH_STRESS_OR_UNCERTAINTY",
    "createdAt": "2026-01-17T11:12:28.010Z",
    "updatedAt": "2026-01-17T11:15:45.230Z"
  }
}
```

### Example 3: Error - Appointment Not Completed

**Request:**

```bash
curl -X POST "https://api.example.com/api/appointment/cmki7k7e40005w7kgz1hcuxu3/session-reason" \
  -H "Authorization: Bearer <doctor_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "LETTING_OFF_STEAM"
  }'
```

**Response:**

```json
{
  "message": "Session reason can only be submitted for completed appointments",
  "success": false
}
```

**Status Code**: `400 Bad Request`

### Example 4: Error - Not the Assigned Doctor

**Request:**

```bash
curl -X POST "https://api.example.com/api/appointment/cmki7k7e40005w7kgz1hcuxu3/session-reason" \
  -H "Authorization: Bearer <other_doctor_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "LETTING_OFF_STEAM"
  }'
```

**Response:**

```json
{
  "message": "Only the doctor can submit session reason for this appointment",
  "success": false
}
```

**Status Code**: `403 Forbidden`

## Integration Flow

### Typical Workflow

1. **Appointment Completion**: Doctor marks appointment as completed using `PATCH /api/appointment/{id}/complete`.

2. **Session Reason Submission**: After completion, doctor submits the session reason using `POST /api/appointment/{id}/session-reason`.

3. **Data Storage**: The session reason is stored in the database and linked to the appointment.

4. **Analytics**: The session reason data can be used for:
   - Understanding patient needs and patterns
   - Generating reports on appointment purposes
   - Improving service offerings based on common reasons

### Frontend Integration

```typescript
// Example: Submitting session reason after appointment completion
async function submitSessionReason(
  appointmentId: string,
  reason: 'LETTING_OFF_STEAM' | 'TALKING_THROUGH_STRESS_OR_UNCERTAINTY' | 'NEEDING_PERSPECTIVE_DURING_A_DEMANDING_PERIOD'
) {
  try {
    const response = await fetch(`/api/appointment/${appointmentId}/session-reason`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({ reason }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to submit session reason')
    }

    const data = await response.json()
    return data.data
  } catch (error) {
    console.error('Error submitting session reason:', error)
    throw error
  }
}

// Usage
await submitSessionReason('appointment_id_123', 'LETTING_OFF_STEAM')
```

## Database Schema

### SessionReason Model

```prisma
model SessionReason {
  id            String      @id @default(cuid())
  appointmentId String      @unique
  reason        SessionReasonType
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @default(now()) @updatedAt
  appointment   Appointment @relation(fields: [appointmentId], references: [id], onDelete: Cascade)

  @@index([appointmentId])
  @@index([reason])
  @@map("session_reason")
}
```

### SessionReasonType Enum

```prisma
enum SessionReasonType {
  LETTING_OFF_STEAM
  TALKING_THROUGH_STRESS_OR_UNCERTAINTY
  NEEDING_PERSPECTIVE_DURING_A_DEMANDING_PERIOD
}
```

## Notes

- Session reasons are optional and can be submitted at any time after an appointment is completed.
- If a session reason already exists, submitting a new one will update the existing record.
- The `updatedAt` timestamp reflects when the session reason was last modified.
- Session reasons are permanently linked to appointments and are deleted if the appointment is deleted (cascade delete).

## Related Endpoints

- `PATCH /api/appointment/{id}/complete` - Mark appointment as completed
- `GET /api/appointment/{id}` - Get appointment details
- `GET /api/appointments/doctor` - Get all doctor appointments


## Session Reason History & Analytics APIs (Doctor Side)

### Overview

These APIs allow doctors to:

- View the **full session reason history** for their completed sessions (with pagination)
- Retrieve **yearly session reason statistics** for graph visualizations

All endpoints:
- Are **doctor-only**
- Respect **anonymous mode** for patients:
  - If a patient has `isAnonymous = true`, their `name`, `email`, and `image` are hidden (`null`)
  - Their `employeeCode` is always visible so the doctor can still identify them internally

Session reasons use the `SessionReasonType` enum from `prisma/schema.prisma`:

- `LETTING_OFF_STEAM`
- `TALKING_THROUGH_STRESS_OR_UNCERTAINTY`
- `NEEDING_PERSPECTIVE_DURING_A_DEMANDING_PERIOD`

---

## 1. Get Full Session Reason History (Paginated)

Returns a **paginated** list of all completed appointments for the authenticated doctor that have a `sessionReason`.

### Endpoint

**GET** `/api/appointments/doctor/session-reasons/full`

### Authentication

- **Required**: Yes
- **Role**: Doctor only

### Query Parameters

| Parameter | Type   | Required | Default | Description                          |
| --------- | ------ | -------- | ------- | ------------------------------------ |
| `page`    | string | No       | `1`     | Page number (1-based)               |
| `limit`   | string | No       | `10`    | Items per page                      |

### Behavior

- Filters appointments by:
  - `doctorId = current doctor`
  - `status = 'COMPLETED'`
  - `sessionReason IS NOT NULL`
- Orders by `endedAt DESC`
- Applies pagination (`page`, `limit`)
- For each appointment:
  - Uses anonymization for patient data based on `isAnonymous`
  - Includes structured `sessionReason` information

### Successful Response

**Status Code**: `200 OK`

```json
{
  "message": "Doctor full session reason history retrieved successfully",
  "success": true,
  "data": {
    "appointments": [
      {
        "id": "cmkixxxxx0005w7kgz1hcuxu3",
        "doctorId": "doctor_user_id",
        "patientId": "patient_user_id",
        "status": "COMPLETED",
        "scheduledAt": "2026-01-18T11:00:00.000Z",
        "startedAt": "2026-01-18T11:05:00.000Z",
        "endedAt": "2026-01-18T11:35:00.000Z",
        "createdAt": "2026-01-18T10:50:00.000Z",
        "updatedAt": "2026-01-18T11:36:00.000Z",
        "chatroomExpiry": null,
        "age": 28,
        "appointmentFor": "self",
        "issue": "Stress at work",
        "uploadId": null,
        "relationWithPatient": null,
        "patientName": null,
        "patientAge": null,
        "doctor": {
          "id": "doctor_user_id",
          "name": "Dr. John Doe",
          "email": "doctor@example.com",
          "image": "https://signed-url...",
          "role": "doctor",
          "employeeCode": null
        },
        "patient": {
          "id": "patient_user_id",
          "name": null,
          "email": null,
          "image": null,
          "role": "patient",
          "employeeCode": "EMP-1234"
        },
        "sessionReason": {
          "reason": "LETTING_OFF_STEAM",
          "createdAt": "2026-01-18T11:40:00.000Z",
          "updatedAt": "2026-01-18T11:40:00.000Z"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

### Error Responses

- `401 Unauthorized` – user not authenticated.
- `403 Forbidden` – user is not a doctor.

---

## 2. Get Yearly Session Reason Stats (For Graphs)

Returns **per-month counts** of session reasons for a given year, for the authenticated doctor.
Designed for charting/graph integration (e.g. bar/line charts).

### Endpoint

**GET** `/api/appointments/doctor/session-reasons/stats/yearly`

### Authentication

- **Required**: Yes
- **Role**: Doctor only

### Query Parameters

| Parameter | Type   | Required | Description              |
| --------- | ------ | -------- | ------------------------ |
| `year`    | string | Yes      | Year (e.g. `2026`)      |

### Behavior

- Filters appointments by:
  - `doctorId = current doctor`
  - `status = 'COMPLETED'`
  - `scheduledAt` within the given year
  - `sessionReason IS NOT NULL`
- Groups data **in code** into 12 buckets (months 1–12), each containing:
  - Count per `SessionReasonType`
  - Total count for that month

This makes it easy to integrate directly into frontend chart libraries (e.g. Recharts, Chart.js, etc.).

### Successful Response

**Status Code**: `200 OK`

```json
{
  "message": "Doctor yearly session reason stats retrieved successfully",
  "success": true,
  "data": {
    "year": 2026,
    "months": [
      {
        "month": 1,
        "LETTING_OFF_STEAM": 3,
        "TALKING_THROUGH_STRESS_OR_UNCERTAINTY": 5,
        "NEEDING_PERSPECTIVE_DURING_A_DEMANDING_PERIOD": 2,
        "total": 10
      },
      {
        "month": 2,
        "LETTING_OFF_STEAM": 1,
        "TALKING_THROUGH_STRESS_OR_UNCERTAINTY": 4,
        "NEEDING_PERSPECTIVE_DURING_A_DEMANDING_PERIOD": 0,
        "total": 5
      }
      // ... up to month 12
    ]
  }
}
```

### Example Frontend Usage (Graph Integration)

```ts
// Example: transform response for a stacked bar chart
const { months } = data // from API response

const chartData = months.map(m => ({
  monthLabel: `M${m.month}`,
  lettingOffSteam: m.LETTING_OFF_STEAM,
  talkingThroughStress: m.TALKING_THROUGH_STRESS_OR_UNCERTAINTY,
  needingPerspective: m.NEEDING_PERSPECTIVE_DURING_A_DEMANDING_PERIOD,
}))
```

### Error Responses

#### 400 Bad Request

```json
{
  "message": "Invalid year",
  "success": false
}
```

**Cause**: `year` is missing or not a valid number.

#### 401 Unauthorized

```json
{
  "message": "Unauthorized",
  "success": false
}
```

**Cause**: User is not authenticated.

#### 403 Forbidden

```json
{
  "message": "Only doctors can access this endpoint",
  "success": false
}
```

**Cause**: Authenticated user is not a doctor.



## Doctor Dashboard & Session History APIs

### Overview

This document describes the **doctor-side** APIs for:

- Getting **session history** (last completed sessions)
- Getting **session reason history** (last sessions with submitted reasons)
- Getting **monthly appointment statistics**

All these endpoints:
- Are **doctor-only**
- Respect **anonymous mode** for patients (name/email/image hidden when `isAnonymous = true`, only `employeeCode` is shown)
- Use the appointment/session data already stored in the system

---

## 1. Get Doctor Session History (Last Completed Sessions)

Returns the last completed sessions for the authenticated doctor, including anonymized patient data and any associated session reason.

### Endpoint

**GET** `/api/appointments/doctor/session-history`

### Authentication

- **Required**: Yes
- **Role**: Doctor only

### Query Parameters

| Parameter | Type   | Required | Default | Description                                           |
| --------- | ------ | -------- | ------- | ----------------------------------------------------- |
| `limit`   | string | No       | `4`     | Number of records to return (last N completed sessions) |

### Behavior

- Returns the **most recent completed appointments** for the doctor.
- For each record:
  - Includes full **doctor** info.
  - Includes **patient** info with anonymization:
    - If `patient.isAnonymous = true`: `name`, `email`, `image` are `null`, `employeeCode` is shown.
  - Includes `sessionReason` if submitted.

### Successful Response

**Status Code**: `200 OK`

```json
{
  "message": "Doctor session history retrieved successfully",
  "success": true,
  "data": [
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
  ]
}
```

### Error Responses

- `401 Unauthorized` – user not authenticated.
- `403 Forbidden` – user is not a doctor.

---

## 2. Get Doctor Session Reason History (Last Session Reasons)

Returns the last sessions **that have a session reason** for the authenticated doctor, with anonymized patient data.

### Endpoint

**GET** `/api/appointments/doctor/session-reasons`

### Authentication

- **Required**: Yes
- **Role**: Doctor only

### Query Parameters

| Parameter | Type   | Required | Default | Description                                      |
| --------- | ------ | -------- | ------- | ------------------------------------------------ |
| `limit`   | string | No       | `3`     | Number of records to return (last N session reasons) |

### Behavior

- Only returns **completed appointments** that **have a `sessionReason`**.
- Ordered by most recent session (`endedAt` descending).
- Patient anonymization:
  - If `isAnonymous = true`, only `employeeCode` is visible; `name`, `email`, `image` are `null`.

### Successful Response

**Status Code**: `200 OK`

```json
{
  "message": "Doctor session reason history retrieved successfully",
  "success": true,
  "data": [
    {
      "appointmentId": "cmkixxxxx0005w7kgz1hcuxu3",
      "doctorId": "doctor_user_id",
      "patientId": "patient_user_id",
      "scheduledAt": "2026-01-18T11:00:00.000Z",
      "startedAt": "2026-01-18T11:05:00.000Z",
      "endedAt": "2026-01-18T11:35:00.000Z",
      "patient": {
        "id": "patient_user_id",
        "name": null,
        "email": null,
        "image": null,
        "role": "patient",
        "employeeCode": "EMP-1234"
      },
      "sessionReason": {
        "reason": "TALKING_THROUGH_STRESS_OR_UNCERTAINTY",
        "createdAt": "2026-01-18T11:40:00.000Z",
        "updatedAt": "2026-01-18T11:40:00.000Z"
      }
    }
  ]
}
```

### Error Responses

- `401 Unauthorized` – user not authenticated.
- `403 Forbidden` – user is not a doctor.

---

## 3. Get Doctor Monthly Appointment Stats

Returns aggregate stats for a given month/year for the authenticated doctor.

### Endpoint

**GET** `/api/appointments/doctor/stats/monthly`

### Authentication

- **Required**: Yes
- **Role**: Doctor only

### Query Parameters

| Parameter | Type   | Required | Description                         |
| --------- | ------ | -------- | ----------------------------------- |
| `month`   | string | Yes      | Month number (`1`–`12`)            |
| `year`    | string | Yes      | Full year (e.g. `2026`)            |

### Behavior

- Computes statistics for the **given month/year**:
  - `totalAppointments`: total appointments scheduled in that month (any status).
  - `completedAppointments`: appointments with `status = 'COMPLETED'` in that month.
- The computation is based on the `scheduledAt` field.

### Successful Response

**Status Code**: `200 OK`

```json
{
  "message": "Doctor monthly appointment stats retrieved successfully",
  "success": true,
  "data": {
    "month": 1,
    "year": 2026,
    "totalAppointments": 12,
    "completedAppointments": 9
  }
}
```

### Error Responses

#### 400 Bad Request

```json
{
  "message": "Invalid month or year",
  "success": false
}
```

**Cause**: `month` or `year` is missing or invalid (`month < 1` or `month > 12`).

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



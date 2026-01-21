## Patient Dashboard APIs

This document describes the **patient-facing dashboard APIs** for:

- **Total sessions & stats for this month**
- **Weekly activity stats** for the activity bar chart (Mon–Sun)
- **Recent session history (last 5 sessions)**
- **Updating user + patient info** (profile)

All endpoints are under the `/api` prefix.

---

## 1. Get Patient Session History (Last 5 Sessions)

Returns the last completed sessions for the authenticated patient, including doctor and patient details. Designed for a “Recent Sessions” list on the patient dashboard.

### Endpoint

**GET** `/api/appointments/patient/session-history`

### Authentication

- **Required**: Yes
- **Role**: `patient` only

### Query Parameters

| Parameter | Type   | Required | Default | Description                                 |
| --------- | ------ | -------- | ------- | ------------------------------------------- |
| `limit`   | string | No       | `5`     | Number of sessions to return (max history) |

### Behavior

- Filters appointments by:
  - `patientId = current user`
  - `status = 'COMPLETED'`
- Orders by `endedAt DESC`
- Returns up to `limit` records, each formatted by the standard appointment formatter (same as other appointment APIs, including anonymization rules).

### Success Response

**Status Code**: `200 OK`

```json
{
  "message": "Patient session history retrieved successfully",
  "success": true,
  "data": [
    {
      "id": "appointment_id_1",
      "doctorId": "doctor_user_id",
      "patientId": "patient_user_id",
      "status": "COMPLETED",
      "scheduledAt": "2026-01-20T07:42:00.303Z",
      "startedAt": "2026-01-20T07:42:30.151Z",
      "endedAt": "2026-01-20T07:42:54.880Z",
      "createdAt": "2026-01-20T07:42:00.305Z",
      "updatedAt": "2026-01-20T07:42:54.881Z",
      "chatroomExpiry": null,
      "age": 25,
      "appointmentFor": "self",
      "issue": "General consultation",
      "uploadId": "https://signed-url-to-uploaded-file",
      "relationWithPatient": null,
      "patientName": null,
      "patientAge": null,
      "doctor": {
        "id": "doctor_user_id",
        "name": "Dr. Georgia Wagner",
        "email": "testdoc@gmail.com",
        "image": "https://signed-url-to-doctor-image.png",
        "role": "doctor",
        "employeeCode": null
      },
      "patient": {
        "id": "patient_user_id",
        "name": "John Doe",
        "email": "patient@example.com",
        "image": "https://signed-url-to-patient-image.png",
        "role": "patient",
        "employeeCode": "EMP12345"
      }
    }
  ]
}
```

### Error Responses

- `401 Unauthorized` – user not authenticated
- `403 Forbidden` – user is not a patient

---

## 2. Get Patient Monthly Stats (This Month)

Returns **total** and **completed** appointment counts for the authenticated patient for a given month and year. This is used for “Total sessions this month” and related KPIs on the dashboard.

### Endpoint

**GET** `/api/appointments/patient/stats/monthly`

### Authentication

- **Required**: Yes
- **Role**: `patient` only

### Query Parameters

| Parameter | Type   | Required | Description                     |
| --------- | ------ | -------- | ------------------------------- |
| `month`   | string | Yes      | Month number (`1`–`12`)        |
| `year`    | string | Yes      | Full year (e.g. `2026`)        |

### Behavior

- Computes start and end of given month in UTC
- Counts:
  - **`totalAppointments`**: all appointments in that month for the patient
  - **`completedAppointments`**: appointments with `status = 'COMPLETED'`

### Success Response

**Status Code**: `200 OK`

```json
{
  "message": "Patient monthly appointment stats retrieved successfully",
  "success": true,
  "data": {
    "month": 1,
    "year": 2026,
    "totalAppointments": 8,
    "completedAppointments": 5
  }
}
```

### Error Responses

- `400 Bad Request` – invalid month/year
- `401 Unauthorized` – user not authenticated
- `403 Forbidden` – user is not a patient

---

## 3. Get Patient Weekly Activity Stats (For Activity Graph)

This API powers the **Activity** bar chart like the screenshot (Mon–Sun). It returns, for the **current week** (or a provided reference date), how many completed sessions the patient had on each weekday.

### Endpoint

**GET** `/api/appointments/patient/stats/activity`

### Authentication

- **Required**: Yes
- **Role**: `patient` only

### Query Parameters

| Parameter       | Type   | Required | Description                                                                 |
| --------------- | ------ | -------- | --------------------------------------------------------------------------- |
| `referenceDate` | string | No       | UTC ISO date used to compute the week (defaults to server “today” if null) |

### Behavior

- Calculates **weekStart** (Monday) and **weekEnd** (Sunday) for the given `referenceDate`
- Filters appointments by:
  - `patientId = current user`
  - `status = 'COMPLETED'`
  - `scheduledAt` between `weekStart` and `weekEnd`
- Groups counts by weekday (`Mon`–`Sun`)
- Returns **7 items** (even if some days have `0`)

### Success Response

**Status Code**: `200 OK`

```json
{
  "message": "Patient weekly activity stats retrieved successfully",
  "success": true,
  "data": {
    "weekStart": "2026-01-19T00:00:00.000Z",
    "weekEnd": "2026-01-25T23:59:59.999Z",
    "days": [
      { "weekday": "Mon", "date": "2026-01-19T00:00:00.000Z", "count": 1 },
      { "weekday": "Tue", "date": "2026-01-20T00:00:00.000Z", "count": 2 },
      { "weekday": "Wed", "date": "2026-01-21T00:00:00.000Z", "count": 1 },
      { "weekday": "Thu", "date": "2026-01-22T00:00:00.000Z", "count": 3 },
      { "weekday": "Fri", "date": "2026-01-23T00:00:00.000Z", "count": 0 },
      { "weekday": "Sat", "date": "2026-01-24T00:00:00.000Z", "count": 1 },
      { "weekday": "Sun", "date": "2026-01-25T00:00:00.000Z", "count": 2 }
    ]
  }
}
```

### Example Frontend Mapping (Activity Chart)

```ts
const { days } = data // from API response

const chartData = days.map(d => ({
  label: d.weekday,   // 'Mon', 'Tue', ...
  value: d.count      // number of completed sessions
}))
```

### Error Responses

- `400 Bad Request` – invalid `referenceDate`
- `401 Unauthorized` – user not authenticated
- `403 Forbidden` – user is not a patient

---

## 4. Update User & Patient Info (Profile)

This endpoint updates **both** basic user profile fields (name, image) and patient info (`userInfo`) in one call. Intended for the patient profile settings screen.

### Endpoint

**PUT** `/api/user/profile`

### Authentication

- **Required**: Yes
- **Role**: `patient` only

### Request Body

```json
{
  "name": "John Doe",
  "image": "https://example.com/profile.jpg",
  "gender": "Male",
  "dateOfBirth": "1995-03-20T00:00:00.000Z",
  "phone": "+1234567890",
  "address": "123 Main Street"
}
```

All fields are **optional**; only provided fields are updated.

#### Field Descriptions

- `name` (string, optional): Full name of the patient
- `image` (string, optional, nullable): Profile image URL (max 500 chars)
- `gender` (string, optional, nullable): Gender (max 20 chars)
- `dateOfBirth` (string, optional, nullable): DOB in UTC ISO 8601 format
- `phone` (string, optional, nullable): Phone number (max 50 chars)
- `address` (string, optional, nullable): Address text

### Success Response

**Status Code**: `200 OK`

```json
{
  "message": "User profile updated successfully",
  "success": true,
  "data": {
    "id": "user_info_id",
    "userId": "user_id",
    "gender": "Male",
    "dateOfBirth": "1995-03-20T00:00:00.000Z",
    "phone": "+1234567890",
    "address": "123 Main Street",
    "createdAt": "2026-01-20T10:00:00.000Z",
    "updatedAt": "2026-01-21T09:30:00.000Z",
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "patient@example.com",
      "image": "https://example.com/profile.jpg",
      "role": "patient",
      "employeeCode": "EMP12345",
      "isAnonymous": false
    }
  }
}
```

### Error Responses

- `401 Unauthorized` – user not authenticated
- `403 Forbidden` – user is not a patient
- `500 Internal Server Error` – unexpected update error

---

## Summary of Patient Dashboard Endpoints

- **Session history (last 5)**: `GET /api/appointments/patient/session-history`
- **Monthly stats (current month)**: `GET /api/appointments/patient/stats/monthly?month=MM&year=YYYY`
- **Weekly activity stats (graph)**: `GET /api/appointments/patient/stats/activity?referenceDate=ISO_DATE`
- **Update user + patient info**: `PUT /api/user/profile`

These APIs mirror the existing **doctor dashboard** analytics, but are tailored for the **patient dashboard**, including activity graphs and profile management.


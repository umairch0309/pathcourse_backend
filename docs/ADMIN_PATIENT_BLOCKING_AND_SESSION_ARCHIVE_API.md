## Admin Patient Blocking & Session Archive APIs

This document describes the admin APIs for:

- Blocking and unblocking **patients**
- Archiving (soft deleting) **sessions/appointments**

All endpoints are **Admin-only** and require:

- Authenticated user with `role === 'admin'` (or legacy super admin)
- Appropriate permission from `PERMISSION_SLUGS`:
  - `USERS_BLOCK_UNBLOCK` (`users.block_unblock`) for patient blocking/unblocking
  - `SESSIONS_ARCHIVE` (`sessions.archive`) for session archive

---

## 1. Block / Unblock Patients

### 1.1 Block Patient

- **Method**: `POST`
- **URL**: `/api/admin/patients/{patientId}/block`
- **Permissions**: `users.block_unblock`

#### Path params

- `patientId`: string (required) – ID of the patient to block

#### Request body

```json
{
  "banReason": "Abusive behavior"
}
```

> `banReason` is optional and can be `null`.

#### Response (200)

```ts
{
  message: 'Patient blocked successfully',
  success: true,
  data: {
    id: string,
    name: string,
    email: string,
    image: string | null,        // signed URL if stored in S3
    phone: string | null,
    role: string | null,         // usually "patient"
    banned: boolean | null,      // true after block
    banReason: string | null,
    banExpires: string | null,   // ISO datetime, currently null (permanent)
    onboardingStage: string | null,
    enterpriseCode: string | null,
    employeeCode: string | null,
    isAnonymous: boolean | null,
    createdAt: string,           // ISO datetime
    updatedAt: string,           // ISO datetime
    userInfo: {
      id: string,
      gender: string | null,
      dateOfBirth: string | null, // ISO datetime
      phone: string | null,
      address: string | null,
    } | null,
  },
}
```

#### Error responses

- `401 Unauthorized` – not logged in
- `403 Forbidden` – user is not admin or lacks `USERS_VIEW`
- `404 Not Found` – patient not found

---

### 1.2 Unblock Patient

- **Method**: `POST`
- **URL**: `/api/admin/patients/{patientId}/unblock`
- **Permissions**: `users.block_unblock`

#### Path params

- `patientId`: string (required)

#### Request body

No body.

#### Response (200)

Same shape as **Block Patient** response, with:

- `banned: false`
- `banReason: null`
- `banExpires: null`

#### Error responses

- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found`

---

## 2. Archive (Soft Delete) Sessions

Sessions are represented by the `Appointment` model. Archiving is implemented as a **soft delete** using a new field:

- `Appointment.isArchived: boolean @default(false)`

Effects:

- Archived appointments remain in the database
- `getAllForAdmin` excludes archived appointments by default

### 2.1 Admin Get All Appointments

Existing endpoint now **excludes archived sessions** by default:

- **Method**: `GET`
- **URL**: `/api/admin/appointments`
- **Permissions**: `sessions.archive`
- Behavior: internally applies `where: { isArchived: false }`

Frontend does not need to change – archived sessions will simply stop showing up in this list.

---

### 2.2 Archive Appointment (Soft Delete)

- **Method**: `POST`
- **URL**: `/api/admin/appointments/{id}/archive`
- **Permissions**: `SESSIONS_VIEW`

#### Path params

- `id`: string (required) – appointment ID

#### Request body

No body.

#### Response (200)

```ts
{
  message: 'Appointment archived successfully',
  success: true,
  data: {
    id: string,
    doctorId: string,
    patientId: string,
    status: 'BOOKED' | 'COMPLETED' | 'NO_SHOW',
    scheduledAt: string | null,
    startedAt: string | null,
    endedAt: string | null,
    createdAt: string,
    updatedAt: string,
    chatroomExpiry: string | null,
    age: number | null,
    appointmentFor: string,
    issue: string,
    uploadId: string | null,
    relationWithPatient: string | null,
    patientName: string | null,
    patientAge: number | null,
    doctor: {
      id: string,
      name: string,
      email: string,
      image: string | null,
      phone: string | null,
      role: string | null,
      isAnonymous: boolean | null,
      employeeCode: string | null,
      enterpriseCode: string | null,
      banned: boolean | null,
      onboardingStage: string | null,
      createdAt: string,
    },
    patient: {
      id: string,
      name: string | null,
      email: string | null,
      image: string | null,
      phone: string | null,
      role: string | null,
      isAnonymous: boolean | null,
      employeeCode: string | null,
      enterpriseCode: string | null,
      banned: boolean | null,
      onboardingStage: string | null,
      createdAt: string,
    },
    appointmentNotes: {
      id: string,
      appointmentId: string,
      doctorId: string,
      notes: string,
      createdAt: string,
      updatedAt: string,
    } | null,
    sessionReason: {
      id: string,
      appointmentId: string,
      reason: string,
      createdAt: string,
      updatedAt: string,
    } | null,
  },
}
```

#### Error responses

- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found`

---

## Frontend Integration Notes

- **Blocking patients**
  - Use `banned` / `banReason` fields to show blocked status and reason in the admin UI.
  - Disable actions for blocked patients as needed.

- **Archiving sessions**
  - After calling the archive API, remove the session from the admin sessions table.
  - Archived sessions are not returned by `/admin/appointments` anymore.

- **Permissions**
  - Ensure the logged-in admin has:
    - `users.view` to list/read patients
    - `users.block_unblock` to block/unblock patients
    - `sessions.view` to list/read sessions
    - `sessions.archive` to archive sessions



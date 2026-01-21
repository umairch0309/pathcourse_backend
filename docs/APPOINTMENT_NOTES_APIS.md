## Appointment Notes APIs (Doctor Only)

This document describes the **appointment notes** APIs that allow doctors to create/update and fetch internal notes for an appointment.

- Notes are **doctor-only**, never exposed to patients.
- Each appointment can have **at most one** `AppointmentNotes` record; the API uses upsert semantics.

---

## 1. Create or Update Appointment Notes

Create or update internal notes for a specific appointment. This is typically used after or during a session to record key observations or follow‑up points.

### Endpoint

**POST** `/api/appointment/{id}/notes`

### Authentication

- **Required**: Yes
- **Role**: `doctor` only

### Path Parameters

| Name | Type   | Required | Description        |
| ---- | ------ | -------- | ------------------ |
| `id` | string | Yes      | Appointment ID     |

### Request Body

```json
{
  "notes": "Patient reported increased stress levels. Recommend follow-up in 2 weeks."
}
```

#### Fields

- `notes` (string, required): The internal notes text for this appointment. Must be at least 1 character.

### Behavior

- Verifies that:
  - The appointment exists.
  - The authenticated doctor is the **assigned doctor** for this appointment.
- If an `AppointmentNotes` record already exists for the appointment, it is **updated**.
- Otherwise, a new `AppointmentNotes` record is **created**.

### Success Response

**Status Code**: `200 OK`

```json
{
  "message": "Appointment notes created or updated successfully",
  "success": true,
  "data": {
    "id": "appointment_notes_id",
    "appointmentId": "appointment_id",
    "doctorId": "doctor_user_id",
    "notes": "Patient reported increased stress levels. Recommend follow-up in 2 weeks.",
    "createdAt": "2026-01-21T10:00:00.000Z",
    "updatedAt": "2026-01-21T10:05:00.000Z"
  }
}
```

### Error Responses

- `401 Unauthorized` – user not authenticated.
- `403 Forbidden` – authenticated user is not a doctor, or is not the assigned doctor for this appointment.
- `404 Not Found` – appointment not found.
- `500 Internal Server Error` – unexpected failure while creating/updating notes.

---

## 2. Get Appointment Notes

Fetch existing internal notes for a specific appointment. Only the doctor assigned to the appointment can view these notes.

### Endpoint

**GET** `/api/appointment/{id}/notes`

### Authentication

- **Required**: Yes
- **Role**: `doctor` only

### Path Parameters

| Name | Type   | Required | Description        |
| ---- | ------ | -------- | ------------------ |
| `id` | string | Yes      | Appointment ID     |

### Behavior

- Verifies that:
  - The appointment exists.
  - The authenticated doctor is the **assigned doctor**.
- Looks up the `AppointmentNotes` record by `appointmentId`.
- Returns `404` if no notes exist for this appointment.

### Success Response

**Status Code**: `200 OK`

```json
{
  "message": "Appointment notes retrieved successfully",
  "success": true,
  "data": {
    "id": "appointment_notes_id",
    "appointmentId": "appointment_id",
    "doctorId": "doctor_user_id",
    "notes": "Patient reported increased stress levels. Recommend follow-up in 2 weeks.",
    "createdAt": "2026-01-21T10:00:00.000Z",
    "updatedAt": "2026-01-21T10:05:00.000Z"
  }
}
```

### Error Responses

- `401 Unauthorized` – user not authenticated.
- `403 Forbidden` – authenticated user is not a doctor, or is not the assigned doctor.
- `404 Not Found` – appointment not found, or notes not found for this appointment.
- `500 Internal Server Error` – unexpected failure while fetching notes.

---

## Data Model

### `AppointmentNotes` Object

```typescript
{
  id: string              // Notes record ID
  appointmentId: string   // Associated appointment ID (unique)
  doctorId: string        // Doctor user ID who owns the notes
  notes: string           // Internal notes text
  createdAt: string       // ISO 8601 datetime
  updatedAt: string       // ISO 8601 datetime
}
```

---

## Usage Notes

1. **Doctor-only access**: Patients and other users can never read or write appointment notes.
2. **One record per appointment**: The API uses upsert semantics, so each appointment has at most one notes record.
3. **Secure access**: Ownership is enforced in the service layer by verifying that `appointment.doctorId === doctorId` before any action.
4. **Integration example**:
   - Use `POST /api/appointment/{id}/notes` from a “Session Notes” form in the doctor UI.
   - Use `GET /api/appointment/{id}/notes` to prefill the form when editing notes for an existing appointment.



# Appointment Booking Implementation

This document describes the appointment booking system implementation with support for booking for "someone else" and doctor availability checks.

## Schema Changes

### User Model Updates
Added optional contact information fields to the `User` model:
- `phone` (String?, VarChar(50))
- `address` (String?, VarChar(500))
- `country` (String?, VarChar(100))
- `city` (String?, VarChar(100))
- `zipCode` (String?, VarChar(20))

### Appointment Model Updates
1. **Status Changes**: Updated `AppointmentStatus` enum from `PENDING, ACCEPTED, IN_PROGRESS, COMPLETED, CANCELED, NO_SHOW` to:
   - `BOOKED` (default status when appointment is created)
   - `COMPLETED`
   - `NO_SHOW`

2. **New Fields for "Someone Else" Bookings**:
   - `relationWithPatient` (String?, VarChar(100)) - Required when `appointmentFor` is "someone else"
   - `patientName` (String?, VarChar(100)) - Required when `appointmentFor` is "someone else"
   - `patientAge` (Int?) - Required when `appointmentFor` is "someone else"

## API Endpoints

### 1. Create Appointment

**Endpoint**: `POST /api/appointment`

**Authentication**: Required (Patient only)

**Description**: Create a new appointment. The system automatically checks if the doctor is available before creating the appointment.

**Request Body**:
```json
{
  "doctorId": "doctor_user_id",
  "appointmentFor": "self" | "someone else",
  "issue": "Reason for appointment",
  "age": 25,  // Optional, required if appointmentFor is "self"
  "uploadId": "optional_upload_id",
  "scheduledAt": "2026-01-20T10:00:00.000Z",  // Optional
  // Required if appointmentFor is "someone else":
  "relationWithPatient": "Son",
  "patientName": "John Doe",
  "patientAge": 30
}
```

**Response**:
```json
{
  "message": "Appointment created successfully",
  "success": true,
  "data": {
    "id": "appointment_id",
    "doctorId": "doctor_user_id",
    "patientId": "patient_user_id",
    "status": "BOOKED",
    "scheduledAt": "2026-01-20T10:00:00.000Z",
    "appointmentFor": "someone else",
    "issue": "Reason for appointment",
    "relationWithPatient": "Son",
    "patientName": "John Doe",
    "patientAge": 30,
    "doctor": {
      "id": "doctor_user_id",
      "name": "Dr. Jane Smith",
      "email": "doctor@example.com",
      "image": "https://...",
      "role": "doctor"
    },
    "patient": {
      "id": "patient_user_id",
      "name": "Patient Name",
      "email": "patient@example.com",
      "image": "https://...",
      "role": "patient"
    }
  }
}
```

**Error Responses**:
- `400 Bad Request`: Doctor is not available for appointments at this time
- `400 Bad Request`: Missing required fields when booking for "someone else"
- `404 Not Found`: Doctor not found
- `401 Unauthorized`: User not authenticated

### 2. Get Appointment by ID

**Endpoint**: `GET /api/appointment/{id}`

**Authentication**: Required

**Description**: Get appointment details. Only the doctor, patient, or admin can access the appointment.

**Response**: Same as create appointment response

### 3. Get All Appointments

**Endpoint**: `GET /api/appointments`

**Authentication**: Required

**Description**: Get all appointments with filtering and pagination. Automatically filters by user role:
- Doctors see only their appointments
- Patients see only their appointments
- Admins see all appointments

**Query Parameters**:
- `doctorId` (optional): Filter by doctor ID
- `patientId` (optional): Filter by patient ID
- `status` (optional): Filter by status (BOOKED, COMPLETED, NO_SHOW)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response**:
```json
{
  "message": "Appointments retrieved successfully",
  "success": true,
  "data": {
    "appointments": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

### 4. Update Appointment Status

**Endpoint**: `PATCH /api/appointment/{id}/status`

**Authentication**: Required (Doctor or Admin only)

**Description**: Update appointment status. Only doctors or admins can update status.

**Request Body**:
```json
{
  "status": "COMPLETED" | "NO_SHOW" | "BOOKED"
}
```

**Response**: Same as create appointment response

## Business Logic

### Availability Check
When creating an appointment, the system:
1. Checks if the doctor exists
2. Verifies that `doctor.isAvailable === true`
3. If doctor is not available, returns `400 Bad Request` with message "Doctor is not available for appointments at this time"

### "Someone Else" Validation
When `appointmentFor === "someone else"`, the system requires:
- `relationWithPatient` - Relationship to the patient
- `patientName` - Name of the person the appointment is for
- `patientAge` - Age of the person the appointment is for

If any of these fields are missing, the system returns `400 Bad Request`.

### Status Flow
- New appointments start with status `BOOKED`
- Doctors can update status to `COMPLETED` or `NO_SHOW`
- When status is updated to `COMPLETED`, the `endedAt` timestamp is automatically set

## Database Migration

After updating the schema, you need to run:

```bash
npx prisma migrate dev --name appointment_booking_updates
```

This will:
1. Add contact fields to User table
2. Update AppointmentStatus enum
3. Change default appointment status to BOOKED
4. Add new fields to Appointment table (relationWithPatient, patientName, patientAge)

## Frontend Integration Example

```typescript
// Create appointment for self
const createAppointment = async (doctorId: string, issue: string, age: number) => {
  const response = await fetch('/api/appointment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      doctorId,
      appointmentFor: 'self',
      issue,
      age
    })
  })
  return response.json()
}

// Create appointment for someone else
const createAppointmentForSomeoneElse = async (
  doctorId: string,
  issue: string,
  relation: string,
  patientName: string,
  patientAge: number
) => {
  const response = await fetch('/api/appointment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      doctorId,
      appointmentFor: 'someone else',
      issue,
      relationWithPatient: relation,
      patientName,
      patientAge
    })
  })
  return response.json()
}

// Update appointment status (doctor only)
const updateAppointmentStatus = async (appointmentId: string, status: 'COMPLETED' | 'NO_SHOW') => {
  const response = await fetch(`/api/appointment/${appointmentId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ status })
  })
  return response.json()
}
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "message": "Error message",
  "success": false
}
```

Common HTTP status codes:
- `200 OK`: Success
- `201 CREATED`: Appointment created successfully
- `400 BAD REQUEST`: Invalid request data or doctor not available
- `401 UNAUTHORIZED`: User not authenticated
- `403 FORBIDDEN`: User doesn't have permission
- `404 NOT FOUND`: Resource not found
- `500 INTERNAL SERVER ERROR`: Server error

## Notes

1. **Availability Check**: The system checks doctor availability at the time of appointment creation. If a doctor becomes unavailable after an appointment is created, existing appointments remain in the system.

2. **Status Management**: Only doctors and admins can update appointment status. Patients cannot change the status of their appointments.

3. **Contact Information**: The new contact fields in the User model are optional and can be updated separately from appointment creation.

4. **Backward Compatibility**: Existing appointments with old status values (PENDING, ACCEPTED, etc.) will need to be migrated. Consider running a data migration script after the schema migration.


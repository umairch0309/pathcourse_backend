# Admin Appointment Management API Documentation

This document provides comprehensive integration instructions for the Admin Appointment Management API endpoints, including fetching appointment history and retrieving appointment details by ID.

## Base URL

All endpoints are prefixed with `/api`:

```
Base URL: https://your-api-domain.com/api
```

## Authentication

All endpoints require admin authentication via better-auth session. The user must have the `admin` role.

## Admin Appointment Management Endpoints

### 1. Get All Appointments (Appointment History)

Retrieve a paginated list of all appointments in the system with advanced filtering and search functionality.

**Endpoint:** `GET /api/admin/appointments`

**Authentication:** Required (Admin only)

**Query Parameters:**
- `page` (string, optional): Page number (default: 1)
- `limit` (string, optional): Items per page (default: 10)
- `status` (string, optional): Filter by appointment status - `BOOKED`, `COMPLETED`, or `NO_SHOW`
- `doctorId` (string, optional): Filter by doctor ID
- `patientId` (string, optional): Filter by patient ID
- `search` (string, optional): Search by issue, patient name, doctor name, or email

**Response (200 OK):**
```json
{
  "message": "Appointments retrieved successfully",
  "success": true,
  "data": {
    "appointments": [
      {
        "id": "clx123...",
        "doctorId": "clx456...",
        "patientId": "clx789...",
        "status": "COMPLETED",
        "scheduledAt": "2024-01-15T10:00:00.000Z",
        "startedAt": "2024-01-15T10:00:05.000Z",
        "endedAt": "2024-01-15T10:30:00.000Z",
        "createdAt": "2024-01-14T08:00:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z",
        "chatroomExpiry": "2024-01-16T10:30:00.000Z",
        "age": 35,
        "appointmentFor": "self",
        "issue": "Anxiety and stress management",
        "uploadId": "https://signed-url...",
        "relationWithPatient": null,
        "patientName": null,
        "patientAge": null,
        "doctor": {
          "id": "clx456...",
          "name": "Dr. Jane Smith",
          "email": "jane.smith@example.com",
          "image": "https://signed-url...",
          "phone": "(321) 123-456",
          "role": "doctor",
          "isAnonymous": false,
          "employeeCode": null,
          "enterpriseCode": null,
          "banned": false,
          "onboardingStage": "COMPLETED"
        },
        "patient": {
          "id": "clx789...",
          "name": "John Doe",
          "email": "john.doe@example.com",
          "image": "https://signed-url...",
          "phone": "(321) 123-457",
          "role": "patient",
          "isAnonymous": false,
          "employeeCode": "ENT001-A1B2C3",
          "enterpriseCode": "ENT001",
          "banned": false,
          "onboardingStage": "COMPLETED"
        },
        "appointmentNotes": {
          "id": "clx101...",
          "appointmentId": "clx123...",
          "doctorId": "clx456...",
          "notes": "Patient showed improvement in anxiety levels. Recommended follow-up in 2 weeks.",
          "createdAt": "2024-01-15T10:30:00.000Z",
          "updatedAt": "2024-01-15T10:30:00.000Z"
        },
        "sessionReason": {
          "id": "clx202...",
          "appointmentId": "clx123...",
          "reason": "NEEDING_PERSPECTIVE_DURING_A_DEMANDING_PERIOD",
          "createdAt": "2024-01-15T10:00:00.000Z",
          "updatedAt": "2024-01-15T10:00:00.000Z"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 250,
      "totalPages": 25
    }
  }
}
```

**Response Schema:**
- `appointments` (array): List of appointment objects
  - `id` (string): Appointment ID
  - `doctorId` (string): Doctor user ID
  - `patientId` (string): Patient user ID
  - `status` (string): Appointment status (`BOOKED`, `COMPLETED`, `NO_SHOW`)
  - `scheduledAt` (string | null): Scheduled date and time (ISO 8601)
  - `startedAt` (string | null): Actual start time (ISO 8601)
  - `endedAt` (string | null): Actual end time (ISO 8601)
  - `createdAt` (string): Creation timestamp (ISO 8601)
  - `updatedAt` (string): Last update timestamp (ISO 8601)
  - `chatroomExpiry` (string | null): Chatroom expiration time (ISO 8601)
  - `age` (number | null): Age of the person
  - `appointmentFor` (string): Who the appointment is for (`self` or `someone else`)
  - `issue` (string): Issue or reason for appointment
  - `uploadId` (string | null): Upload ID/document URL (signed S3 URL)
  - `relationWithPatient` (string | null): Relation with patient (if booking for someone else)
  - `patientName` (string | null): Patient name (if booking for someone else)
  - `patientAge` (number | null): Patient age (if booking for someone else)
  - `doctor` (object): Doctor information
    - `id` (string): Doctor user ID
    - `name` (string): Doctor name
    - `email` (string): Doctor email
    - `image` (string | null): Doctor profile image (signed S3 URL)
    - `phone` (string | null): Doctor phone number
    - `role` (string | null): User role
    - `isAnonymous` (boolean | null): Anonymous mode status
    - `employeeCode` (string | null): Employee code
    - `enterpriseCode` (string | null): Enterprise code
    - `banned` (boolean | null): Ban status
    - `onboardingStage` (string | null): Onboarding stage
  - `patient` (object): Patient information (same structure as doctor)
  - `appointmentNotes` (object | null): Appointment notes from doctor
    - `id` (string): Notes ID
    - `appointmentId` (string): Associated appointment ID
    - `doctorId` (string): Doctor who wrote the notes
    - `notes` (string): Notes content
    - `createdAt` (string): Creation timestamp (ISO 8601)
    - `updatedAt` (string): Last update timestamp (ISO 8601)
  - `sessionReason` (object | null): Session reason
    - `id` (string): Session reason ID
    - `appointmentId` (string): Associated appointment ID
    - `reason` (string): Session reason type
    - `createdAt` (string): Creation timestamp (ISO 8601)
    - `updatedAt` (string): Last update timestamp (ISO 8601)
- `pagination` (object): Pagination metadata
  - `page` (number): Current page number
  - `limit` (number): Items per page
  - `total` (number): Total number of appointments
  - `totalPages` (number): Total number of pages

**Error Responses:**

- **401 Unauthorized**: Not authenticated
  ```json
  {
    "message": "Unauthorized",
    "success": false
  }
  ```

- **403 Forbidden**: Not an admin user
  ```json
  {
    "message": "Forbidden - Admin only",
    "success": false
  }
  ```

**Business Logic:**
1. Returns all appointments regardless of status (unless filtered)
2. Includes full doctor and patient information
3. Includes appointment notes and session reason when available
4. Converts S3 image keys to signed URLs (valid for 7 days)
5. Supports multiple filtering options (status, doctorId, patientId)
6. Search works across: issue, patient name, doctor name, and email fields
7. Results are ordered by creation date (newest first)

**Example Usage (JavaScript/TypeScript):**
```typescript
async function getAllAppointments(filters?: {
  page?: number
  limit?: number
  status?: 'BOOKED' | 'COMPLETED' | 'NO_SHOW'
  doctorId?: string
  patientId?: string
  search?: string
}) {
  const params = new URLSearchParams()
  if (filters?.page) params.append('page', filters.page.toString())
  if (filters?.limit) params.append('limit', filters.limit.toString())
  if (filters?.status) params.append('status', filters.status)
  if (filters?.doctorId) params.append('doctorId', filters.doctorId)
  if (filters?.patientId) params.append('patientId', filters.patientId)
  if (filters?.search) params.append('search', filters.search)

  const response = await fetch(`/api/admin/appointments?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      // Include authentication headers (cookies/session)
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to fetch appointments')
  }

  const result = await response.json()
  return result.data
}

// Usage examples
const allAppointments = await getAllAppointments({ page: 1, limit: 20 })

const completedAppointments = await getAllAppointments({
  page: 1,
  limit: 10,
  status: 'COMPLETED'
})

const doctorAppointments = await getAllAppointments({
  page: 1,
  limit: 50,
  doctorId: 'clx456...'
})

const searchResults = await getAllAppointments({
  page: 1,
  limit: 20,
  search: 'anxiety'
})
```

**Example Usage (React Component):**
```tsx
import { useState, useEffect } from 'react'

function AppointmentHistory() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true)
      try {
        const data = await getAllAppointments({
          page,
          limit: 10,
          status: statusFilter || undefined,
          search: search || undefined,
        })
        setAppointments(data.appointments)
      } catch (error) {
        console.error('Failed to fetch appointments:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAppointments()
  }, [page, statusFilter, search])

  return (
    <div>
      <h1>Appointment History</h1>

      <div>
        <input
          type="text"
          placeholder="Search appointments..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setPage(1)
          }}
        >
          <option value="">All Statuses</option>
          <option value="BOOKED">Booked</option>
          <option value="COMPLETED">Completed</option>
          <option value="NO_SHOW">No Show</option>
        </select>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Doctor</th>
              <th>Patient</th>
              <th>Status</th>
              <th>Issue</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appointment) => (
              <tr key={appointment.id}>
                <td>{new Date(appointment.scheduledAt || appointment.createdAt).toLocaleDateString()}</td>
                <td>{appointment.doctor.name}</td>
                <td>{appointment.patient.name}</td>
                <td>{appointment.status}</td>
                <td>{appointment.issue.substring(0, 50)}...</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
```

---

### 2. Get Appointment by ID

Retrieve detailed information about a specific appointment by its ID.

**Endpoint:** `GET /api/admin/appointments/{id}`

**Authentication:** Required (Admin only)

**Path Parameters:**
- `id` (string, required): Appointment ID

**Response (200 OK):**
```json
{
  "message": "Appointment retrieved successfully",
  "success": true,
  "data": {
    "id": "clx123...",
    "doctorId": "clx456...",
    "patientId": "clx789...",
    "status": "COMPLETED",
    "scheduledAt": "2024-01-15T10:00:00.000Z",
    "startedAt": "2024-01-15T10:00:05.000Z",
    "endedAt": "2024-01-15T10:30:00.000Z",
    "createdAt": "2024-01-14T08:00:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "chatroomExpiry": "2024-01-16T10:30:00.000Z",
    "age": 35,
    "appointmentFor": "self",
    "issue": "Anxiety and stress management",
    "uploadId": "https://signed-url...",
    "relationWithPatient": null,
    "patientName": null,
    "patientAge": null,
    "doctor": {
      "id": "clx456...",
      "name": "Dr. Jane Smith",
      "email": "jane.smith@example.com",
      "image": "https://signed-url...",
      "phone": "(321) 123-456",
      "role": "doctor",
      "isAnonymous": false,
      "employeeCode": null,
      "enterpriseCode": null,
      "banned": false,
      "onboardingStage": "COMPLETED",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "patient": {
      "id": "clx789...",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "image": "https://signed-url...",
      "phone": "(321) 123-457",
      "role": "patient",
      "isAnonymous": false,
      "employeeCode": "ENT001-A1B2C3",
      "enterpriseCode": "ENT001",
      "banned": false,
      "onboardingStage": "COMPLETED",
      "createdAt": "2024-01-02T00:00:00.000Z"
    },
    "appointmentNotes": {
      "id": "clx101...",
      "appointmentId": "clx123...",
      "doctorId": "clx456...",
      "notes": "Patient showed improvement in anxiety levels. Recommended follow-up in 2 weeks.",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    "sessionReason": {
      "id": "clx202...",
      "appointmentId": "clx123...",
      "reason": "NEEDING_PERSPECTIVE_DURING_A_DEMANDING_PERIOD",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  }
}
```

**Response Schema:**
Same as individual appointment object in the list endpoint (see above), with additional `createdAt` timestamp for doctor and patient.

**Error Responses:**

- **401 Unauthorized**: Not authenticated
  ```json
  {
    "message": "Unauthorized",
    "success": false
  }
  ```

- **403 Forbidden**: Not an admin user
  ```json
  {
    "message": "Forbidden - Admin only",
    "success": false
  }
  ```

- **404 Not Found**: Appointment not found
  ```json
  {
    "message": "Appointment not found",
    "success": false
  }
  ```

**Business Logic:**
1. Returns complete appointment details with full doctor and patient information
2. Includes appointment notes and session reason when available
3. Converts S3 image keys to signed URLs (valid for 7 days)
4. Includes account creation dates for doctor and patient

**Example Usage (JavaScript/TypeScript):**
```typescript
async function getAppointmentById(appointmentId: string) {
  const response = await fetch(`/api/admin/appointments/${appointmentId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      // Include authentication headers (cookies/session)
    },
  })

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Appointment not found')
    }
    const error = await response.json()
    throw new Error(error.message || 'Failed to fetch appointment')
  }

  const result = await response.json()
  return result.data
}

// Usage
const appointment = await getAppointmentById('clx123...')
console.log('Appointment:', {
  id: appointment.id,
  doctor: appointment.doctor.name,
  patient: appointment.patient.name,
  status: appointment.status,
  issue: appointment.issue,
  notes: appointment.appointmentNotes?.notes,
})
```

**Example Usage (React Component):**
```tsx
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'

function AppointmentDetail() {
  const { id } = useParams()
  const [appointment, setAppointment] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchAppointment = async () => {
      if (!id) return

      setLoading(true)
      setError(null)
      try {
        const data = await getAppointmentById(id)
        setAppointment(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchAppointment()
  }, [id])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!appointment) return <div>Appointment not found</div>

  return (
    <div>
      <h1>Appointment Details</h1>

      <div>
        <h2>Status: {appointment.status}</h2>
        <p>Scheduled: {new Date(appointment.scheduledAt).toLocaleString()}</p>
        {appointment.startedAt && (
          <p>Started: {new Date(appointment.startedAt).toLocaleString()}</p>
        )}
        {appointment.endedAt && (
          <p>Ended: {new Date(appointment.endedAt).toLocaleString()}</p>
        )}
      </div>

      <div>
        <h3>Doctor</h3>
        <p>Name: {appointment.doctor.name}</p>
        <p>Email: {appointment.doctor.email}</p>
        <p>Phone: {appointment.doctor.phone}</p>
      </div>

      <div>
        <h3>Patient</h3>
        <p>Name: {appointment.patient.name}</p>
        <p>Email: {appointment.patient.email}</p>
        <p>Phone: {appointment.patient.phone}</p>
        <p>Enterprise: {appointment.patient.enterpriseCode}</p>
        <p>Employee Code: {appointment.patient.employeeCode}</p>
      </div>

      <div>
        <h3>Appointment Information</h3>
        <p>Issue: {appointment.issue}</p>
        <p>Appointment For: {appointment.appointmentFor}</p>
        {appointment.appointmentNotes && (
          <div>
            <h4>Notes</h4>
            <p>{appointment.appointmentNotes.notes}</p>
          </div>
        )}
        {appointment.sessionReason && (
          <div>
            <h4>Session Reason</h4>
            <p>{appointment.sessionReason.reason}</p>
          </div>
        )}
      </div>
    </div>
  )
}
```

---

## Complete Example: Admin Appointment Management Workflow

```typescript
// 1. Get all appointments with pagination
const firstPage = await getAllAppointments({ page: 1, limit: 10 })
console.log(`Total appointments: ${firstPage.pagination.total}`)
console.log(`Appointments on page 1: ${firstPage.appointments.length}`)

// 2. Filter by status
const completedAppointments = await getAllAppointments({
  page: 1,
  limit: 20,
  status: 'COMPLETED'
})
console.log(`Found ${completedAppointments.appointments.length} completed appointments`)

// 3. Filter by doctor
const doctorAppointments = await getAllAppointments({
  page: 1,
  limit: 50,
  doctorId: 'clx456...'
})
console.log(`Found ${doctorAppointments.appointments.length} appointments for doctor`)

// 4. Filter by patient
const patientAppointments = await getAllAppointments({
  page: 1,
  limit: 50,
  patientId: 'clx789...'
})
console.log(`Found ${patientAppointments.appointments.length} appointments for patient`)

// 5. Search appointments
const searchResults = await getAllAppointments({
  page: 1,
  limit: 20,
  search: 'anxiety'
})
console.log(`Found ${searchResults.appointments.length} appointments matching "anxiety"`)

// 6. Get detailed information about a specific appointment
const appointment = await getAppointmentById('clx123...')
console.log('Appointment details:', {
  id: appointment.id,
  doctor: appointment.doctor.name,
  patient: appointment.patient.name,
  status: appointment.status,
  issue: appointment.issue,
  scheduledAt: appointment.scheduledAt,
  notes: appointment.appointmentNotes?.notes,
  sessionReason: appointment.sessionReason?.reason
})
```

---

## Related Endpoints

- **Get Approved Doctors**: `/api/admin/doctors/approved` - Get all approved doctors
- **Get All Patients**: `/api/admin/patients` - Get all patients
- **Get All User Queries**: `/api/admin/user-queries` - Get all user queries

## Security Considerations

1. **Admin-Only Access**: All endpoints require admin authentication and role verification
2. **Image Security**: All images (doctor, patient, uploadId) are converted to signed S3 URLs valid for 7 days
3. **Data Privacy**: Appointment data includes sensitive medical information - ensure proper access controls
4. **Search Functionality**: Search is case-insensitive and works across multiple fields
5. **Pagination**: Large result sets are paginated to prevent performance issues
6. **Filtering**: Multiple filter options allow admins to narrow down results efficiently

## Notes

- All datetime fields are returned in ISO 8601 format (UTC)
- Image URLs are automatically converted from S3 keys to signed URLs (valid for 7 days)
- The `appointmentNotes` field may be `null` if the doctor hasn't added notes yet
- The `sessionReason` field may be `null` if no session reason was specified
- The `uploadId` field contains a signed URL to any uploaded documents
- When `appointmentFor` is `"someone else"`, the `patientName`, `patientAge`, and `relationWithPatient` fields will be populated
- Appointment status can be: `BOOKED`, `COMPLETED`, or `NO_SHOW`
- Results are ordered by creation date (newest first)

## Field Descriptions

### Appointment Fields

- **id**: Unique appointment ID (CUID format)
- **doctorId**: Doctor user ID
- **patientId**: Patient user ID
- **status**: Appointment status (`BOOKED`, `COMPLETED`, `NO_SHOW`)
- **scheduledAt**: Scheduled date and time (null if not scheduled)
- **startedAt**: Actual start time (null if not started)
- **endedAt**: Actual end time (null if not ended)
- **createdAt**: Appointment creation timestamp
- **updatedAt**: Last update timestamp
- **chatroomExpiry**: Chatroom expiration time (null if expired or not created)
- **age**: Age of the person (if booking for self)
- **appointmentFor**: Who the appointment is for (`self` or `someone else`)
- **issue**: Issue or reason for the appointment
- **uploadId**: Upload ID/document URL (signed S3 URL, null if no upload)
- **relationWithPatient**: Relation with patient (if booking for someone else)
- **patientName**: Patient name (if booking for someone else)
- **patientAge**: Patient age (if booking for someone else)

### Doctor/Patient Fields

- **id**: User ID
- **name**: User name
- **email**: Email address
- **image**: Profile image (signed S3 URL)
- **phone**: Phone number
- **role**: User role (`doctor` or `patient`)
- **isAnonymous**: Whether user is in anonymous mode
- **employeeCode**: Employee code within enterprise
- **enterpriseCode**: Enterprise code
- **banned**: Whether user is banned
- **onboardingStage**: Onboarding stage
- **createdAt**: Account creation date (only in getById response)

### Appointment Notes Fields

- **id**: Notes ID
- **appointmentId**: Associated appointment ID
- **doctorId**: Doctor who wrote the notes
- **notes**: Notes content
- **createdAt**: Notes creation timestamp
- **updatedAt**: Notes last update timestamp

### Session Reason Fields

- **id**: Session reason ID
- **appointmentId**: Associated appointment ID
- **reason**: Session reason type (e.g., `NEEDING_PERSPECTIVE_DURING_A_DEMANDING_PERIOD`)
- **createdAt**: Creation timestamp
- **updatedAt**: Last update timestamp

## Error Handling Best Practices

```typescript
async function safeGetAppointmentById(appointmentId: string) {
  try {
    const appointment = await getAppointmentById(appointmentId)
    return { success: true, data: appointment }
  } catch (error) {
    if (error.message.includes('not found')) {
      return { success: false, error: 'APPOINTMENT_NOT_FOUND' }
    }
    if (error.message.includes('Forbidden')) {
      return { success: false, error: 'UNAUTHORIZED' }
    }
    return { success: false, error: 'UNKNOWN_ERROR', message: error.message }
  }
}
```

## Filtering Examples

### Filter by Status
```typescript
// Get only completed appointments
const completed = await getAllAppointments({
  page: 1,
  limit: 20,
  status: 'COMPLETED'
})

// Get only booked appointments
const booked = await getAllAppointments({
  page: 1,
  limit: 20,
  status: 'BOOKED'
})
```

### Filter by Doctor
```typescript
// Get all appointments for a specific doctor
const doctorAppointments = await getAllAppointments({
  page: 1,
  limit: 50,
  doctorId: 'clx456...'
})
```

### Filter by Patient
```typescript
// Get all appointments for a specific patient
const patientAppointments = await getAllAppointments({
  page: 1,
  limit: 50,
  patientId: 'clx789...'
})
```

### Combined Filters
```typescript
// Get completed appointments for a specific doctor
const doctorCompleted = await getAllAppointments({
  page: 1,
  limit: 20,
  doctorId: 'clx456...',
  status: 'COMPLETED'
})

// Search with filters
const searchWithFilters = await getAllAppointments({
  page: 1,
  limit: 20,
  status: 'COMPLETED',
  search: 'anxiety'
})
```


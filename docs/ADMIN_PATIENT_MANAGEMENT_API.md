# Admin Patient Management API Documentation

This document provides comprehensive integration instructions for the Admin Patient Management API endpoints, including fetching all patients and retrieving patient details by ID.

## Base URL

All endpoints are prefixed with `/api`:

```
Base URL: https://your-api-domain.com/api
```

## Authentication

All endpoints require admin authentication via better-auth session. The user must have the `admin` role.

## Admin Patient Management Endpoints

### 1. Get All Patients

Retrieve a paginated list of all patients in the system with optional search functionality.

**Endpoint:** `GET /api/admin/patients`

**Authentication:** Required (Admin only)

**Query Parameters:**
- `page` (string, optional): Page number (default: 1)
- `limit` (string, optional): Items per page (default: 10)
- `search` (string, optional): Search by name, email, employee code, or enterprise code

**Response (200 OK):**
```json
{
  "message": "Patients retrieved successfully",
  "success": true,
  "data": {
    "patients": [
      {
        "id": "clx123...",
        "name": "John Doe",
        "email": "john.doe@example.com",
        "image": "https://signed-url...",
        "phone": "(321) 123-456",
        "role": "patient",
        "banned": false,
        "banReason": null,
        "banExpires": null,
        "onboardingStage": "COMPLETED",
        "enterpriseCode": "ENT001",
        "employeeCode": "ENT001-A1B2C3",
        "isAnonymous": false,
        "createdAt": "2024-01-15T10:00:00.000Z",
        "updatedAt": "2024-01-15T10:00:00.000Z",
        "userInfo": {
          "id": "clx456...",
          "gender": "male",
          "dateOfBirth": "1990-05-15T00:00:00.000Z",
          "phone": "(321) 123-456",
          "address": "123 Main St, City, State"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 150,
      "totalPages": 15
    }
  }
}
```

**Response Schema:**
- `patients` (array): List of patient objects
  - `id` (string): Patient user ID
  - `name` (string): Patient name
  - `email` (string): Patient email address
  - `image` (string | null): Patient profile image (signed S3 URL)
  - `phone` (string | null): Phone number
  - `role` (string | null): User role (should be "patient")
  - `banned` (boolean | null): Whether the patient is banned
  - `banReason` (string | null): Reason for ban (if banned)
  - `banExpires` (string | null): Ban expiration date (ISO 8601)
  - `onboardingStage` (string | null): Onboarding stage
  - `enterpriseCode` (string | null): Associated enterprise code
  - `employeeCode` (string | null): Employee code within enterprise
  - `isAnonymous` (boolean | null): Whether patient is in anonymous mode
  - `createdAt` (string): Account creation date (ISO 8601)
  - `updatedAt` (string): Last update date (ISO 8601)
  - `userInfo` (object | null): Additional user information
    - `id` (string): UserInfo ID
    - `gender` (string | null): Gender
    - `dateOfBirth` (string | null): Date of birth (ISO 8601)
    - `phone` (string | null): Phone number
    - `address` (string | null): Address
- `pagination` (object): Pagination metadata
  - `page` (number): Current page number
  - `limit` (number): Items per page
  - `total` (number): Total number of patients
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
1. Only returns users with `role = 'patient'`
2. Includes related `userInfo` when available
3. Converts S3 image keys to signed URLs (valid for 7 days)
4. Supports pagination and search across multiple fields
5. Search works on: name, email, employeeCode, and enterpriseCode

**Example Usage (JavaScript/TypeScript):**
```typescript
async function getAllPatients(filters?: {
  page?: number
  limit?: number
  search?: string
}) {
  const params = new URLSearchParams()
  if (filters?.page) params.append('page', filters.page.toString())
  if (filters?.limit) params.append('limit', filters.limit.toString())
  if (filters?.search) params.append('search', filters.search)

  const response = await fetch(`/api/admin/patients?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      // Include authentication headers (cookies/session)
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to fetch patients')
  }

  const result = await response.json()
  return result.data
}

// Usage examples
const allPatients = await getAllPatients({
  page: 1,
  limit: 20
})

const searchResults = await getAllPatients({
  page: 1,
  limit: 10,
  search: 'john'
})

const enterprisePatients = await getAllPatients({
  page: 1,
  limit: 50,
  search: 'ENT001'
})
```

**Example Usage (React Component):**
```tsx
import { useState, useEffect } from 'react'

function PatientList() {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchPatients = async () => {
      setLoading(true)
      try {
        const data = await getAllPatients({ page, limit: 10, search })
        setPatients(data.patients)
      } catch (error) {
        console.error('Failed to fetch patients:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPatients()
  }, [page, search])

  return (
    <div>
      <input
        type="text"
        placeholder="Search patients..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {loading ? (
        <div>Loading...</div>
      ) : (
        <ul>
          {patients.map((patient) => (
            <li key={patient.id}>
              <h3>{patient.name}</h3>
              <p>Email: {patient.email}</p>
              <p>Enterprise: {patient.enterpriseCode}</p>
              <p>Employee Code: {patient.employeeCode}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

---

### 2. Get Patient by ID

Retrieve detailed information about a specific patient by their user ID.

**Endpoint:** `GET /api/admin/patients/{patientId}`

**Authentication:** Required (Admin only)

**Path Parameters:**
- `patientId` (string, required): Patient user ID

**Response (200 OK):**
```json
{
  "message": "Patient retrieved successfully",
  "success": true,
  "data": {
    "id": "clx123...",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "image": "https://signed-url...",
    "phone": "(321) 123-456",
    "role": "patient",
    "banned": false,
    "banReason": null,
    "banExpires": null,
    "onboardingStage": "COMPLETED",
    "enterpriseCode": "ENT001",
    "employeeCode": "ENT001-A1B2C3",
    "isAnonymous": false,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z",
    "userInfo": {
      "id": "clx456...",
      "gender": "male",
      "dateOfBirth": "1990-05-15T00:00:00.000Z",
      "phone": "(321) 123-456",
      "address": "123 Main St, City, State"
    }
  }
}
```

**Response Schema:**
Same as individual patient object in the list endpoint (see above).

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

- **404 Not Found**: Patient not found
  ```json
  {
    "message": "Patient not found",
    "success": false
  }
  ```

**Business Logic:**
1. Verifies that the user exists and has `role = 'patient'`
2. Includes related `userInfo` when available
3. Converts S3 image keys to signed URLs (valid for 7 days)
4. Returns null if patient doesn't exist or is not a patient

**Example Usage (JavaScript/TypeScript):**
```typescript
async function getPatientById(patientId: string) {
  const response = await fetch(`/api/admin/patients/${patientId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      // Include authentication headers (cookies/session)
    },
  })

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Patient not found')
    }
    const error = await response.json()
    throw new Error(error.message || 'Failed to fetch patient')
  }

  const result = await response.json()
  return result.data
}

// Usage
const patient = await getPatientById('clx123...')
console.log('Patient:', patient.name)
console.log('Enterprise:', patient.enterpriseCode)
console.log('Date of Birth:', patient.userInfo?.dateOfBirth)
```

**Example Usage (React Component):**
```tsx
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'

function PatientDetail() {
  const { patientId } = useParams()
  const [patient, setPatient] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchPatient = async () => {
      if (!patientId) return

      setLoading(true)
      setError(null)
      try {
        const data = await getPatientById(patientId)
        setPatient(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchPatient()
  }, [patientId])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!patient) return <div>Patient not found</div>

  return (
    <div>
      <h1>{patient.name}</h1>
      <img src={patient.image || '/default-avatar.png'} alt={patient.name} />
      <p>Email: {patient.email}</p>
      <p>Phone: {patient.phone}</p>
      <p>Enterprise: {patient.enterpriseCode}</p>
      <p>Employee Code: {patient.employeeCode}</p>
      {patient.userInfo && (
        <div>
          <h2>Additional Information</h2>
          <p>Gender: {patient.userInfo.gender}</p>
          <p>Date of Birth: {patient.userInfo.dateOfBirth}</p>
          <p>Address: {patient.userInfo.address}</p>
        </div>
      )}
    </div>
  )
}
```

---

## Complete Example: Admin Patient Management Workflow

```typescript
// 1. Get all patients with pagination
const firstPage = await getAllPatients({ page: 1, limit: 10 })
console.log(`Total patients: ${firstPage.pagination.total}`)
console.log(`Patients on page 1: ${firstPage.patients.length}`)

// 2. Search for patients by name
const searchResults = await getAllPatients({
  page: 1,
  limit: 20,
  search: 'John'
})
console.log(`Found ${searchResults.patients.length} patients matching "John"`)

// 3. Get patients from a specific enterprise
const enterprisePatients = await getAllPatients({
  page: 1,
  limit: 50,
  search: 'ENT001'
})
console.log(`Found ${enterprisePatients.patients.length} patients in enterprise ENT001`)

// 4. Get detailed information about a specific patient
const patient = await getPatientById('clx123...')
console.log('Patient details:', {
  name: patient.name,
  email: patient.email,
  enterprise: patient.enterpriseCode,
  employeeCode: patient.employeeCode,
  dateOfBirth: patient.userInfo?.dateOfBirth,
  address: patient.userInfo?.address
})

// 5. Check if patient is banned
if (patient.banned) {
  console.log(`Patient is banned. Reason: ${patient.banReason}`)
  if (patient.banExpires) {
    console.log(`Ban expires: ${patient.banExpires}`)
  }
}
```

---

## Related Endpoints

- **Get Approved Doctors**: `/api/admin/doctors/approved` - Get all approved doctors
- **Create Doctor**: `/api/admin/doctors` - Create a new doctor (admin only)
- **Block/Unblock Doctor**: `/api/admin/doctors/{doctorId}/block` and `/api/admin/doctors/{doctorId}/unblock`

## Security Considerations

1. **Admin-Only Access**: All endpoints require admin authentication and role verification
2. **Image Security**: Patient images are converted to signed S3 URLs valid for 7 days
3. **Data Privacy**: Patient data includes sensitive information - ensure proper access controls
4. **Search Functionality**: Search is case-insensitive and works across multiple fields
5. **Pagination**: Large result sets are paginated to prevent performance issues

## Notes

- Patient images are automatically converted from S3 keys to signed URLs (valid for 7 days)
- The `userInfo` field may be `null` if the patient hasn't completed their profile information
- Patients can be in anonymous mode (`isAnonymous: true`), which may affect how their information is displayed
- The `banned` field indicates if a patient has been blocked from the system
- `enterpriseCode` and `employeeCode` are only present for patients associated with an enterprise
- All datetime fields are returned in ISO 8601 format (UTC)

## Field Descriptions

### Patient Fields

- **id**: Unique patient user ID (CUID format)
- **name**: Patient's full name
- **email**: Patient's email address (used for login)
- **image**: Profile image URL (signed S3 URL, valid for 7 days)
- **phone**: Contact phone number
- **role**: User role (should always be "patient" for these endpoints)
- **banned**: Boolean indicating if patient is banned
- **banReason**: Reason for ban (if applicable)
- **banExpires**: Ban expiration date (null for permanent bans)
- **onboardingStage**: Current onboarding stage (e.g., "COMPLETED")
- **enterpriseCode**: Code of the enterprise the patient belongs to
- **employeeCode**: Unique employee code within the enterprise
- **isAnonymous**: Whether patient is using anonymous mode
- **createdAt**: Account creation timestamp
- **updatedAt**: Last update timestamp

### UserInfo Fields (Optional)

- **id**: UserInfo record ID
- **gender**: Patient's gender
- **dateOfBirth**: Patient's date of birth
- **phone**: Additional phone number (may differ from user.phone)
- **address**: Patient's address

## Error Handling Best Practices

```typescript
async function safeGetPatientById(patientId: string) {
  try {
    const patient = await getPatientById(patientId)
    return { success: true, data: patient }
  } catch (error) {
    if (error.message.includes('not found')) {
      return { success: false, error: 'PATIENT_NOT_FOUND' }
    }
    if (error.message.includes('Forbidden')) {
      return { success: false, error: 'UNAUTHORIZED' }
    }
    return { success: false, error: 'UNKNOWN_ERROR', message: error.message }
  }
}
```


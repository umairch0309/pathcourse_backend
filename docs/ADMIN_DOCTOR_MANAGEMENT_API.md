# Admin Doctor Management API Documentation

This document provides comprehensive integration instructions for the Admin Doctor Management API endpoints. All endpoints are **admin-only** and require authentication.

## Base URL

All endpoints are prefixed with `/api`:

```
Base URL: https://your-api-domain.com/api
```

## Authentication

- **All endpoints**: Admin authentication required
- Users must have `role: "admin"` to access these endpoints
- Authentication is handled via better-auth session cookies

## Doctor Request Status

Doctor profile status is managed through the `onboardingStage` field on the User model:

- **`WAITING_FOR_ADMIN`**: Pending approval (doctor has submitted their profile)
- **`COMPLETED`**: Approved by admin
- **`REJECTED`**: Rejected by admin (rejection reason stored in `Doctor.rejectReason`)

## Admin Doctor Management Endpoints

### 1. Get All Doctor Requests

Retrieve all pending doctor requests with pagination and optional search.

**Endpoint:** `GET /api/admin/doctor-requests`

**Authentication:** Required (Admin only)

**Query Parameters:**
- `page` (string, optional): Page number (default: 1)
- `limit` (string, optional): Items per page (default: 10)
- `search` (string, optional): Search by name, email, or professional email (case-insensitive)

**Response (200 OK):**
```json
{
  "message": "Doctor requests retrieved successfully",
  "success": true,
  "data": {
    "doctors": [
      {
        "id": "clx123...",
        "userid": "user456...",
        "professional_contact": "+1234567890",
        "professional_email": "doctor@example.com",
        "secondary_contact": null,
        "isAvailable": false,
        "isInMeeting": false,
        "rejectReason": null,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "user": {
          "id": "user456...",
          "name": "Dr. Jane Smith",
          "email": "jane.smith@example.com",
          "image": "https://...",
          "role": "doctor",
          "onboardingStage": "DOCTOR_INFO",
          "createdAt": "2024-01-01T00:00:00.000Z"
        },
        "documents": {
          "id": "doc123...",
          "resume": "https://...",
          "medicalLicense": "https://...",
          "introductionVideo": "https://..."
        },
        "education": [
          {
            "id": "edu123...",
            "degree": "MD",
            "institution_name": "Medical School",
            "startYear": "2010-09-01T00:00:00.000Z",
            "endYear": "2014-06-01T00:00:00.000Z"
          }
        ],
        "professionalExperience": {
          "id": "exp123...",
          "profession": "Psychiatrist",
          "special_interest_area": "Mental Health",
          "age_group": "Adults",
          "languages": ["English", "Spanish"]
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

**Error Responses:**

- **401 Unauthorized**: Not authenticated
  ```json
  {
    "message": "Unauthorized",
    "success": false
  }
  ```

- **403 Forbidden**: Not an admin
  ```json
  {
    "message": "Forbidden - Admin only",
    "success": false
  }
  ```

**Example Usage:**
```typescript
async function getDoctorRequests(filters?: {
  page?: number
  limit?: number
  search?: string
}) {
  const params = new URLSearchParams()
  if (filters?.page) params.append('page', filters.page.toString())
  if (filters?.limit) params.append('limit', filters.limit.toString())
  if (filters?.search) params.append('search', filters.search)

  const response = await fetch(`/api/admin/doctor-requests?${params.toString()}`, {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to retrieve doctor requests')
  }

  const result = await response.json()
  return result.data
}

// Usage
const data = await getDoctorRequests({
  page: 1,
  limit: 10,
  search: 'Jane',
})
```

### 2. Approve Doctor

Approve a doctor request. Sets the doctor's onboarding stage to `COMPLETED` and clears any previous rejection reason.

**Endpoint:** `POST /api/admin/doctor-requests/approve`

**Authentication:** Required (Admin only)

**Request Body:**
```json
{
  "doctorId": "clx123..."
}
```

**Request Schema:**
- `doctorId` (string, required): Doctor ID to approve

**Response (200 OK):**
```json
{
  "message": "Doctor approved successfully",
  "success": true,
  "data": {
    "id": "clx123...",
    "userid": "user456...",
    "professional_contact": "+1234567890",
    "professional_email": "doctor@example.com",
    "rejectReason": null,
    "user": {
      "id": "user456...",
      "name": "Dr. Jane Smith",
      "email": "jane.smith@example.com",
      "onboardingStage": "COMPLETED"
    }
  }
}
```

**Error Responses:**

- **404 Not Found**: Doctor not found
  ```json
  {
    "message": "Doctor not found",
    "success": false
  }
  ```

**Business Logic:**
1. Verifies the doctor exists
2. Updates user's `onboardingStage` to `"COMPLETED"`
3. Clears any existing `rejectReason` in the Doctor record
4. Returns updated doctor information

**Example Usage:**
```typescript
async function approveDoctor(doctorId: string) {
  const response = await fetch('/api/admin/doctor-requests/approve', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ doctorId }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to approve doctor')
  }

  const result = await response.json()
  return result.data
}

// Usage
const approvedDoctor = await approveDoctor('clx123...')
console.log('Doctor approved:', approvedDoctor.user.onboardingStage) // "COMPLETED"
```

### 3. Reject Doctor

Reject a doctor request. Sets the doctor's onboarding stage to `REJECTED` and saves the rejection reason.

**Endpoint:** `POST /api/admin/doctor-requests/reject`

**Authentication:** Required (Admin only)

**Request Body:**
```json
{
  "doctorId": "clx123...",
  "rejectReason": "Incomplete documentation. Please provide valid medical license."
}
```

**Request Schema:**
- `doctorId` (string, required): Doctor ID to reject
- `rejectReason` (string, required): Reason for rejection (minimum 1 character)

**Response (200 OK):**
```json
{
  "message": "Doctor rejected successfully",
  "success": true,
  "data": {
    "id": "clx123...",
    "userid": "user456...",
    "professional_contact": "+1234567890",
    "professional_email": "doctor@example.com",
    "rejectReason": "Incomplete documentation. Please provide valid medical license.",
    "user": {
      "id": "user456...",
      "name": "Dr. Jane Smith",
      "email": "jane.smith@example.com",
      "onboardingStage": "REJECTED"
    }
  }
}
```

**Error Responses:**

- **404 Not Found**: Doctor not found
  ```json
  {
    "message": "Doctor not found",
    "success": false
  }
  ```

- **422 Unprocessable Entity**: Validation error
  ```json
  {
    "message": "Validation failed",
    "errors": {
      "rejectReason": "Reject reason is required"
    }
  }
  ```

**Business Logic:**
1. Verifies the doctor exists
2. Updates user's `onboardingStage` to `"REJECTED"`
3. Saves the `rejectReason` in the Doctor record
4. Returns updated doctor information with rejection reason

**Example Usage:**
```typescript
async function rejectDoctor(doctorId: string, rejectReason: string) {
  const response = await fetch('/api/admin/doctor-requests/reject', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ doctorId, rejectReason }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to reject doctor')
  }

  const result = await response.json()
  return result.data
}

// Usage
const rejectedDoctor = await rejectDoctor(
  'clx123...',
  'Incomplete documentation. Please provide valid medical license.'
)
console.log('Rejection reason:', rejectedDoctor.rejectReason)
console.log('Status:', rejectedDoctor.user.onboardingStage) // "REJECTED"
```

## Integration Notes

1. **Admin-Only Access**: All endpoints require admin authentication. Ensure your frontend checks user role before displaying admin UI.

2. **Pending Doctors**: The system identifies pending doctors by checking for `onboardingStage` values of `"DOCTOR_INFO"` or `"ROLE_SELECTION"`.

3. **Status Management**: Doctor approval/rejection status is managed through the User's `onboardingStage` field:
   - `COMPLETED`: Doctor is approved and can use the platform
   - `REJECTED`: Doctor is rejected (reason stored in `Doctor.rejectReason`)

4. **Rejection Reason**: When rejecting a doctor, the reason is required and will be stored in the `Doctor.rejectReason` field. This can be displayed to the doctor for feedback.

5. **Approval Clears Rejection**: When approving a previously rejected doctor, the `rejectReason` is automatically cleared.

## React Component Example

```tsx
import { useState, useEffect } from 'react'

function DoctorRequestsManagement() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/doctor-requests?page=1&limit=10', {
        credentials: 'include',
      })
      const result = await response.json()
      setRequests(result.data.doctors)
    } catch (error) {
      console.error('Failed to fetch requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (doctorId: string) => {
    try {
      const response = await fetch('/api/admin/doctor-requests/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ doctorId }),
      })

      if (!response.ok) throw new Error('Failed to approve')

      alert('Doctor approved successfully')
      fetchRequests()
    } catch (error) {
      alert('Failed to approve doctor')
    }
  }

  const handleReject = async (doctorId: string) => {
    if (!rejectReason.trim()) {
      alert('Please provide a rejection reason')
      return
    }

    try {
      const response = await fetch('/api/admin/doctor-requests/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ doctorId, rejectReason }),
      })

      if (!response.ok) throw new Error('Failed to reject')

      alert('Doctor rejected successfully')
      setSelectedDoctor(null)
      setRejectReason('')
      fetchRequests()
    } catch (error) {
      alert('Failed to reject doctor')
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <h2>Doctor Requests</h2>
      {requests.map((doctor) => (
        <div key={doctor.id} className="doctor-request-card">
          <h3>{doctor.user.name}</h3>
          <p>Email: {doctor.user.email}</p>
          <p>Professional Email: {doctor.professional_email}</p>
          <p>Status: {doctor.user.onboardingStage}</p>

          {doctor.documents && (
            <div>
              <p>Documents: ✓ Submitted</p>
            </div>
          )}

          {doctor.education.length > 0 && (
            <div>
              <p>Education: {doctor.education.length} record(s)</p>
            </div>
          )}

          <div className="actions">
            <button onClick={() => handleApprove(doctor.id)}>
              Approve
            </button>
            <button onClick={() => setSelectedDoctor(doctor.id)}>
              Reject
            </button>
          </div>

          {selectedDoctor === doctor.id && (
            <div className="reject-form">
              <textarea
                placeholder="Enter rejection reason..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
              />
              <button onClick={() => handleReject(doctor.id)}>
                Confirm Rejection
              </button>
              <button onClick={() => {
                setSelectedDoctor(null)
                setRejectReason('')
              }}>
                Cancel
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
```

## Error Handling Best Practices

```typescript
async function handleDoctorAction(
  action: 'approve' | 'reject',
  doctorId: string,
  rejectReason?: string
) {
  try {
    const endpoint = action === 'approve'
      ? '/api/admin/doctor-requests/approve'
      : '/api/admin/doctor-requests/reject'

    const body = action === 'approve'
      ? { doctorId }
      : { doctorId, rejectReason }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json()

      if (response.status === 401) {
        // Redirect to login
        window.location.href = '/login'
        return
      }

      if (response.status === 403) {
        alert('You do not have permission to perform this action')
        return
      }

      if (response.status === 404) {
        alert('Doctor not found')
        return
      }

      throw new Error(error.message || 'Operation failed')
    }

    const result = await response.json()
    return { success: true, data: result.data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    }
  }
}
```

## Related Endpoints

- **Doctor Signup**: `/api/auth/doctor/signup` - Doctors sign up and start with `DOCTOR_INFO` stage
- **Doctor Profile**: `/api/doctor-profile` - Doctors complete their profile information
- **User Management**: Admin endpoints for managing users

## Security Considerations

1. **Admin-Only Access**: All endpoints are protected and require admin role
2. **Input Validation**: All inputs are validated using Zod schemas
3. **Rejection Reason**: Required when rejecting to ensure proper documentation
4. **Status Tracking**: Doctor status is tracked through onboardingStage for audit purposes


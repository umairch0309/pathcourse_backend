# Admin Doctor Management API Documentation

This document provides comprehensive integration instructions for the Admin Doctor Management API endpoints, including fetching approved doctors, creating new doctors, and blocking/unblocking doctors.

## Base URL

All endpoints are prefixed with `/api`:

```
Base URL: https://your-api-domain.com/api
```

## Authentication

All endpoints require admin authentication via better-auth session. The user must have the `admin` role.

## Admin Doctor Management Endpoints

### 1. Get Approved Doctors

Retrieve a paginated list of all approved doctors (doctors with `onboardingStage = 'COMPLETED'` and `banned = false`).

**Endpoint:** `GET /api/admin/doctors/approved`

**Authentication:** Required (Admin only)

**Query Parameters:**
- `page` (string, optional): Page number (default: 1)
- `limit` (string, optional): Items per page (default: 10)
- `search` (string, optional): Search by name, email, or professional email

**Response (200 OK):**
```json
{
  "message": "Approved doctors retrieved successfully",
  "success": true,
  "data": {
    "doctors": [
      {
        "id": "clx123...",
        "userid": "clx456...",
        "professional_contact": "(321) 123-456",
        "professional_email": "doctor@example.com",
        "secondary_contact": "(321) 123-457",
        "isAvailable": true,
        "isInMeeting": false,
        "createdAt": "2024-01-15T10:00:00.000Z",
        "updatedAt": "2024-01-15T10:00:00.000Z",
        "user": {
          "id": "clx456...",
          "name": "Dr. Jane Smith",
          "email": "jane.smith@example.com",
          "image": "https://signed-url...",
          "role": "doctor",
          "phone": "(321) 123-456",
          "banned": false,
          "banReason": null,
          "banExpires": null,
          "onboardingStage": "COMPLETED",
          "createdAt": "2024-01-15T10:00:00.000Z"
        },
        "documents": {
          "id": "clx789...",
          "resume": "https://signed-url...",
          "medicalLicense": "https://signed-url...",
          "introductionVideo": "https://signed-url..."
        },
        "education": [
          {
            "id": "clx101...",
            "degree": "MD",
            "institution_name": "Medical University",
            "startYear": "2010-01-01T00:00:00.000Z",
            "endYear": "2014-01-01T00:00:00.000Z",
            "document": "https://signed-url..."
          }
        ],
        "professionalExperience": {
          "id": "clx202...",
          "profession": "Psychiatrist",
          "special_interest_area": "Anxiety Disorders",
          "age_group": "Adults",
          "languages": ["English", "Spanish"]
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
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

- **403 Forbidden**: Not an admin user
  ```json
  {
    "message": "Forbidden - Admin only",
    "success": false
  }
  ```

**Business Logic:**
1. Only returns doctors with `onboardingStage = 'COMPLETED'` and `banned = false`
2. Includes full doctor profile with user information, documents, education, and professional experience
3. Converts S3 file URLs to signed URLs (valid for 7 days)
4. Supports pagination and search functionality

**Example Usage (JavaScript/TypeScript):**
```typescript
async function getApprovedDoctors(filters?: {
  page?: number
  limit?: number
  search?: string
}) {
  const params = new URLSearchParams()
  if (filters?.page) params.append('page', filters.page.toString())
  if (filters?.limit) params.append('limit', filters.limit.toString())
  if (filters?.search) params.append('search', filters.search)

  const response = await fetch(`/api/admin/doctors/approved?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      // Include authentication headers (cookies/session)
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to fetch approved doctors')
  }

  const result = await response.json()
  return result.data
}

// Usage
const doctors = await getApprovedDoctors({
  page: 1,
  limit: 20,
  search: 'Smith'
})
```

---

### 2. Create New Doctor

Create a new doctor account with credentials. The doctor is automatically approved (pre-approved by admin).

**Endpoint:** `POST /api/admin/doctors`

**Authentication:** Required (Admin only)

**Request Body:**
```json
{
  "name": "Dr. John Doe",
  "email": "john.doe@example.com",
  "password": "securePassword123",
  "professional_email": "doctor.john@clinic.com",
  "professional_contact": "(321) 123-456",
  "secondary_contact": "(321) 123-457",
  "phone": "(321) 123-456"
}
```

**Request Schema:**
- `name` (string, required): Doctor name (1-100 characters)
- `email` (string, required): Doctor email for login (must be unique)
- `password` (string, required): Password (minimum 8 characters)
- `professional_email` (string, required): Professional email address (must be unique)
- `professional_contact` (string, required): Professional contact number
- `secondary_contact` (string, optional): Secondary contact number
- `phone` (string, optional): Phone number

**Response (201 Created):**
```json
{
  "message": "Doctor created successfully",
  "success": true,
  "data": {
    "id": "clx123...",
    "userid": "clx456...",
    "professional_contact": "(321) 123-456",
    "professional_email": "doctor.john@clinic.com",
    "secondary_contact": "(321) 123-457",
    "isAvailable": false,
    "isInMeeting": false,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z",
    "user": {
      "id": "clx456...",
      "name": "Dr. John Doe",
      "email": "john.doe@example.com",
      "image": null,
      "role": "doctor",
      "phone": "(321) 123-456",
      "banned": false,
      "banReason": null,
      "banExpires": null,
      "onboardingStage": "COMPLETED",
      "createdAt": "2024-01-15T10:00:00.000Z"
    },
    "documents": null,
    "education": [],
    "professionalExperience": null
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

- **403 Forbidden**: Not an admin user
  ```json
  {
    "message": "Forbidden - Admin only",
    "success": false
  }
  ```

- **409 Conflict**: Email or professional email already exists
  ```json
  {
    "message": "Email already exists",
    "success": false
  }
  ```

- **422 Unprocessable Entity**: Validation error
  ```json
  {
    "message": "Validation failed",
    "errors": {
      "email": "Invalid email format",
      "password": "Password must be at least 8 characters"
    }
  }
  ```

**Business Logic:**
1. Creates a new user account using better-auth (password is automatically hashed)
2. Sets user role to `doctor`
3. Sets onboarding stage to `COMPLETED` (pre-approved by admin)
4. Creates doctor record with professional information
5. Doctor starts with `isAvailable = false` (must manually toggle availability)
6. Validates that email and professional_email are unique

**Example Usage (JavaScript/TypeScript):**
```typescript
async function createDoctor(data: {
  name: string
  email: string
  password: string
  professional_email: string
  professional_contact: string
  secondary_contact?: string
  phone?: string
}) {
  const response = await fetch('/api/admin/doctors', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Include authentication headers (cookies/session)
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to create doctor')
  }

  const result = await response.json()
  return result.data
}

// Usage
const doctor = await createDoctor({
  name: 'Dr. John Doe',
  email: 'john.doe@example.com',
  password: 'securePassword123',
  professional_email: 'doctor.john@clinic.com',
  professional_contact: '(321) 123-456',
  secondary_contact: '(321) 123-457',
  phone: '(321) 123-456'
})

// Note: In a real application, you would send credentials to the doctor's personal email
// This is typically done via email service (not included in this API)
```

---

### 3. Block Doctor

Block a doctor, preventing them from accessing the system. This sets `banned = true` on the user account.

**Endpoint:** `POST /api/admin/doctors/{doctorId}/block`

**Authentication:** Required (Admin only)

**Path Parameters:**
- `doctorId` (string, required): Doctor ID to block

**Request Body:**
```json
{
  "banReason": "Violation of terms of service"
}
```

**Request Schema:**
- `banReason` (string, optional): Reason for blocking the doctor

**Response (200 OK):**
```json
{
  "message": "Doctor blocked successfully",
  "success": true,
  "data": {
    "id": "clx123...",
    "userid": "clx456...",
    "professional_contact": "(321) 123-456",
    "professional_email": "doctor.john@clinic.com",
    "user": {
      "id": "clx456...",
      "name": "Dr. John Doe",
      "email": "john.doe@example.com",
      "image": "https://signed-url...",
      "role": "doctor",
      "phone": "(321) 123-456",
      "banned": true,
      "banReason": "Violation of terms of service",
      "banExpires": null,
      "onboardingStage": "COMPLETED"
    }
  }
}
```

**Error Responses:**

- **401 Unauthorized**: Not authenticated
- **403 Forbidden**: Not an admin user
- **404 Not Found**: Doctor not found

**Business Logic:**
1. Sets `banned = true` on the user account
2. Optionally stores `banReason` for audit purposes
3. Sets `banExpires = null` (permanent ban unless manually unblocked)
4. Blocked doctors are excluded from approved doctors list

**Example Usage (JavaScript/TypeScript):**
```typescript
async function blockDoctor(doctorId: string, banReason?: string) {
  const response = await fetch(`/api/admin/doctors/${doctorId}/block`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Include authentication headers (cookies/session)
    },
    body: JSON.stringify({ banReason }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to block doctor')
  }

  const result = await response.json()
  return result.data
}

// Usage
const blockedDoctor = await blockDoctor('clx123...', 'Violation of terms of service')
```

---

### 4. Unblock Doctor

Unblock a previously blocked doctor, restoring their access to the system.

**Endpoint:** `POST /api/admin/doctors/{doctorId}/unblock`

**Authentication:** Required (Admin only)

**Path Parameters:**
- `doctorId` (string, required): Doctor ID to unblock

**Response (200 OK):**
```json
{
  "message": "Doctor unblocked successfully",
  "success": true,
  "data": {
    "id": "clx123...",
    "userid": "clx456...",
    "professional_contact": "(321) 123-456",
    "professional_email": "doctor.john@clinic.com",
    "user": {
      "id": "clx456...",
      "name": "Dr. John Doe",
      "email": "john.doe@example.com",
      "image": "https://signed-url...",
      "role": "doctor",
      "phone": "(321) 123-456",
      "banned": false,
      "banReason": null,
      "banExpires": null,
      "onboardingStage": "COMPLETED"
    }
  }
}
```

**Error Responses:**

- **401 Unauthorized**: Not authenticated
- **403 Forbidden**: Not an admin user
- **404 Not Found**: Doctor not found

**Business Logic:**
1. Sets `banned = false` on the user account
2. Clears `banReason` and `banExpires`
3. Doctor becomes available in approved doctors list again

**Example Usage (JavaScript/TypeScript):**
```typescript
async function unblockDoctor(doctorId: string) {
  const response = await fetch(`/api/admin/doctors/${doctorId}/unblock`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Include authentication headers (cookies/session)
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to unblock doctor')
  }

  const result = await response.json()
  return result.data
}

// Usage
const unblockedDoctor = await unblockDoctor('clx123...')
```

---

## Complete Example: Admin Doctor Management Workflow

```typescript
// 1. Get all approved doctors
const approvedDoctors = await getApprovedDoctors({ page: 1, limit: 10 })

// 2. Create a new doctor
const newDoctor = await createDoctor({
  name: 'Dr. Jane Smith',
  email: 'jane.smith@example.com',
  password: 'securePassword123',
  professional_email: 'doctor.jane@clinic.com',
  professional_contact: '(321) 123-456',
  phone: '(321) 123-456'
})

// 3. Block a doctor (if needed)
const blockedDoctor = await blockDoctor(newDoctor.id, 'Violation of terms')

// 4. Unblock a doctor (if needed)
const unblockedDoctor = await unblockDoctor(blockedDoctor.id)
```

---

## Related Endpoints

- **Get Pending Doctor Requests**: `/api/admin/doctor-requests` - Get doctors waiting for approval
- **Approve Doctor Request**: `/api/admin/doctor-requests/approve` - Approve a pending doctor request
- **Reject Doctor Request**: `/api/admin/doctor-requests/reject` - Reject a pending doctor request

## Security Considerations

1. **Admin-Only Access**: All endpoints require admin authentication and role verification
2. **Password Security**: Passwords are automatically hashed using better-auth's secure hashing
3. **Email Uniqueness**: Both login email and professional email must be unique
4. **Pre-Approved Doctors**: Doctors created by admin are automatically approved (onboardingStage = 'COMPLETED')
5. **Blocking Mechanism**: Blocked doctors are excluded from approved doctors list and cannot access the system
6. **Audit Trail**: Ban reasons are stored for audit purposes

## Notes

- When creating a new doctor, the credentials (email and password) should be sent to the doctor's personal email address (as shown in the form). This email sending functionality is not included in this API and should be implemented separately using an email service.
- Blocked doctors are automatically excluded from the approved doctors list (filtered by `banned = false`)
- Doctors created by admin start with `isAvailable = false` and must manually toggle their availability
- All file URLs (images, documents) are converted to signed S3 URLs valid for 7 days

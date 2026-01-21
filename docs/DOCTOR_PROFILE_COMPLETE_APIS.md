# Doctor Profile Complete APIs

This document describes the comprehensive Doctor Profile APIs for managing complete doctor profile information, including basic profile details, education records, professional experience, and documents.

## Overview

The Doctor Profile Complete APIs provide endpoints for doctors to:
- Retrieve their complete profile with all related information
- Update basic profile information
- Update professional experience
- Update documents
- Add new education records
- Delete individual education records

All endpoints require authentication and are restricted to users with the `doctor` role.

## Base URL

All endpoints are prefixed with `/api`

## Authentication

All endpoints require authentication. Include the authentication token in the request headers:

```
Authorization: Bearer <token>
```

**Note:** Only users with the `doctor` role can access these endpoints.

---

## Endpoints

### 1. Get Complete Doctor Profile

Retrieve the complete doctor profile with all details including basic information, education records, professional experience, and documents. All file URLs are automatically converted to signed S3 URLs.

**Endpoint:** `GET /api/doctor/profile/complete`

**Authentication:** Required (Doctor role only)

**Request:** None

**Response:**

```json
{
  "message": "Complete doctor profile retrieved successfully",
  "success": true,
  "data": {
    "doctor": {
      "id": "doctor_id",
      "userid": "user_id",
      "professional_contact": "+1234567890",
      "professional_email": "doctor@example.com",
      "secondary_contact": "+0987654321",
      "isAvailable": true,
      "isInMeeting": false,
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z",
      "user": {
        "id": "user_id",
        "name": "Dr. John Smith",
        "email": "doctor@example.com",
        "image": "https://signed-url-to-image.jpg",
        "role": "doctor",
        "isAnonymous": false,
        "employeeCode": "DOC12345",
        "userInfo": {
          "id": "user_info_id",
          "userId": "user_id",
          "gender": "Male",
          "dateOfBirth": "1980-05-15T00:00:00.000Z",
          "phone": "+1234567890",
          "address": "123 Medical Center Dr",
          "createdAt": "2024-01-15T10:00:00.000Z",
          "updatedAt": "2024-01-15T10:00:00.000Z"
        }
      }
    },
    "education": [
      {
        "id": "education_id_1",
        "doctorId": "doctor_id",
        "degree": "Doctor of Medicine (MD)",
        "startYear": "2010-09-01T00:00:00.000Z",
        "endYear": "2015-06-30T00:00:00.000Z",
        "document": "https://signed-url-to-certificate.pdf",
        "institution_name": "Harvard Medical School",
        "createdAt": "2024-01-15T10:00:00.000Z",
        "updatedAt": "2024-01-15T10:00:00.000Z"
      },
      {
        "id": "education_id_2",
        "doctorId": "doctor_id",
        "degree": "Bachelor of Science",
        "startYear": "2006-09-01T00:00:00.000Z",
        "endYear": "2010-06-30T00:00:00.000Z",
        "document": null,
        "institution_name": "MIT",
        "createdAt": "2024-01-15T10:00:00.000Z",
        "updatedAt": "2024-01-15T10:00:00.000Z"
      }
    ],
    "professionalExperience": {
      "id": "prof_exp_id",
      "doctorId": "doctor_id",
      "age_group": "Adults (18-65)",
      "languages": ["English", "Spanish", "French"],
      "profession": "Cardiologist",
      "special_interest_area": "Heart Disease Prevention",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    },
    "documents": {
      "id": "documents_id",
      "doctorId": "doctor_id",
      "resume": "https://signed-url-to-resume.pdf",
      "medicalLicense": "https://signed-url-to-license.pdf",
      "introductionVideo": "https://signed-url-to-video.mp4",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  }
}
```

**Error Responses:**

- `401 Unauthorized`: User not authenticated
- `403 Forbidden`: Only doctors can access this endpoint
- `404 Not Found`: Doctor not found

**Notes:**

- All file URLs (images, documents, videos) are automatically converted to signed S3 URLs with 7-day expiry
- Education records are sorted by start year in descending order (most recent first)
- If professional experience or documents don't exist, they will be `null` in the response

---

### 2. Update Doctor Profile

Update basic doctor profile information including professional contact details, user image, and user info.

**Endpoint:** `PUT /api/doctor/profile`

**Authentication:** Required (Doctor role only)

**Request Body:**

```json
{
  "professional_contact": "+1234567890",
  "professional_email": "doctor@example.com",
  "secondary_contact": "+0987654321",
  "image": "https://example.com/profile-image.jpg",
  "gender": "Male",
  "dateOfBirth": "1980-05-15T00:00:00.000Z",
  "phone": "+1234567890",
  "address": "123 Medical Center Dr"
}
```

All fields are optional. Only provided fields will be updated.

**Field Descriptions:**

- `professional_contact` (string, optional): Professional contact number
- `professional_email` (string, optional): Professional email address (must be unique)
- `secondary_contact` (string, optional, nullable): Secondary contact number
- `image` (string, optional, nullable): Profile image URL (max 500 characters)
- `gender` (string, optional, nullable): Gender (max 20 characters)
- `dateOfBirth` (string, optional, nullable): Date of birth in UTC (ISO 8601 format)
- `phone` (string, optional, nullable): Phone number (max 50 characters)
- `address` (string, optional, nullable): Address (max 500 characters)

**Response:**

```json
{
  "message": "Doctor profile updated successfully",
  "success": true,
  "data": {
    "id": "doctor_id",
    "userid": "user_id",
    "professional_contact": "+1234567890",
    "professional_email": "doctor@example.com",
    "secondary_contact": "+0987654321",
    "isAvailable": true,
    "isInMeeting": false,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:05:00.000Z",
    "user": {
      "id": "user_id",
      "name": "Dr. John Smith",
      "email": "doctor@example.com",
      "image": "https://signed-url-to-image.jpg",
      "role": "doctor",
      "isAnonymous": false,
      "employeeCode": "DOC12345",
      "userInfo": {
        "id": "user_info_id",
        "userId": "user_id",
        "gender": "Male",
        "dateOfBirth": "1980-05-15T00:00:00.000Z",
        "phone": "+1234567890",
        "address": "123 Medical Center Dr",
        "createdAt": "2024-01-15T10:00:00.000Z",
        "updatedAt": "2024-01-15T10:05:00.000Z"
      }
    }
  }
}
```

**Error Responses:**

- `400 Bad Request`: Professional email already exists or invalid data
- `401 Unauthorized`: User not authenticated
- `403 Forbidden`: Only doctors can access this endpoint
- `404 Not Found`: Doctor not found
- `422 Unprocessable Entity`: Validation errors

**Notes:**

- Only fields provided in the request body will be updated
- To set optional fields to `null`, explicitly pass `null` in the request
- User image URL is automatically converted to signed S3 URL in the response

---

### 3. Update Professional Experience

Update doctor's professional experience information. All fields are optional - existing values will be preserved if not provided.

**Endpoint:** `PUT /api/doctor/profile/professional-experience`

**Authentication:** Required (Doctor role only)

**Request Body:**

```json
{
  "age_group": "Adults (18-65)",
  "languages": ["English", "Spanish", "French"],
  "profession": "Cardiologist",
  "special_interest_area": "Heart Disease Prevention"
}
```

All fields are optional. If professional experience doesn't exist and no fields are provided, an error will be returned.

**Field Descriptions:**

- `age_group` (string, optional): Age group the doctor serves (max 100 characters)
- `languages` (array of strings, optional): Array of languages the doctor speaks (minimum 1 language if provided)
- `profession` (string, optional): Doctor profession/specialty
- `special_interest_area` (string, optional): Special interest area

**Response:**

```json
{
  "message": "Professional experience updated successfully",
  "success": true,
  "data": {
    "id": "prof_exp_id",
    "doctorId": "doctor_id",
    "age_group": "Adults (18-65)",
    "languages": ["English", "Spanish", "French"],
    "profession": "Cardiologist",
    "special_interest_area": "Heart Disease Prevention",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:05:00.000Z"
  }
}
```

**Error Responses:**

- `401 Unauthorized`: User not authenticated
- `403 Forbidden`: Only doctors can access this endpoint
- `404 Not Found`: Doctor not found or professional experience not found (if trying to create without providing fields)
- `422 Unprocessable Entity`: Validation errors

**Notes:**

- Only provided fields will be updated
- Existing values are preserved for fields not included in the request
- If professional experience doesn't exist yet, you must provide at least one field to create it

---

### 4. Update Documents

Update doctor's documents including resume, medical license, and introduction video. All fields are optional - existing values will be preserved if not provided.

**Endpoint:** `PUT /api/doctor/profile/documents`

**Authentication:** Required (Doctor role only)

**Request Body:**

```json
{
  "resume": "https://example.com/resume.pdf",
  "medicalLicense": "https://example.com/license.pdf",
  "introductionVideo": "https://example.com/video.mp4"
}
```

All fields are optional. All fields can be set to `null` to remove documents.

**Field Descriptions:**

- `resume` (string, optional, nullable): Resume document URL (max 500 characters)
- `medicalLicense` (string, optional, nullable): Medical license document URL (max 500 characters)
- `introductionVideo` (string, optional, nullable): Introduction video URL (max 500 characters, 20-30 second video recommended)

**Response:**

```json
{
  "message": "Documents updated successfully",
  "success": true,
  "data": {
    "id": "documents_id",
    "doctorId": "doctor_id",
    "resume": "https://signed-url-to-resume.pdf",
    "medicalLicense": "https://signed-url-to-license.pdf",
    "introductionVideo": "https://signed-url-to-video.mp4",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:05:00.000Z"
  }
}
```

**Error Responses:**

- `401 Unauthorized`: User not authenticated
- `403 Forbidden`: Only doctors can access this endpoint
- `404 Not Found`: Doctor not found
- `422 Unprocessable Entity`: Validation errors

**Notes:**

- Only provided fields will be updated
- Existing values are preserved for fields not included in the request
- All document URLs are automatically converted to signed S3 URLs in the response
- To remove a document, set its field to `null`

---

### 5. Add Education Record

Add a new education record to the doctor's profile.

**Endpoint:** `POST /api/doctor/profile/education`

**Authentication:** Required (Doctor role only)

**Request Body:**

```json
{
  "degree": "Doctor of Medicine (MD)",
  "startYear": "2010-09-01T00:00:00.000Z",
  "endYear": "2015-06-30T00:00:00.000Z",
  "document": "https://example.com/certificate.pdf",
  "institution_name": "Harvard Medical School"
}
```

**Field Descriptions:**

- `degree` (string, required): Degree or qualification name (max 100 characters)
- `startYear` (string, required): Start year in UTC (ISO 8601 format)
- `endYear` (string, optional, nullable): End year in UTC (ISO 8601 format)
- `document` (string, optional, nullable): Document URL (e.g., certificate) (max 500 characters)
- `institution_name` (string, required): Institution name (max 200 characters)

**Response:**

```json
{
  "message": "Education record added successfully",
  "success": true,
  "data": {
    "id": "education_id",
    "doctorId": "doctor_id",
    "degree": "Doctor of Medicine (MD)",
    "startYear": "2010-09-01T00:00:00.000Z",
    "endYear": "2015-06-30T00:00:00.000Z",
    "document": "https://signed-url-to-certificate.pdf",
    "institution_name": "Harvard Medical School",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Error Responses:**

- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: User not authenticated
- `403 Forbidden`: Only doctors can access this endpoint
- `404 Not Found`: Doctor not found
- `422 Unprocessable Entity`: Validation errors

**Notes:**

- Document URL is automatically converted to signed S3 URL in the response
- You can add multiple education records by calling this endpoint multiple times
- Education records are automatically sorted by start year in descending order

---

### 6. Delete Education Record

Delete an individual education record. Only the doctor who owns the record can delete it. This does not delete the doctor's profile or other records.

**Endpoint:** `DELETE /api/doctor/profile/education/{id}`

**Authentication:** Required (Doctor role only)

**Path Parameters:**

- `id` (string, required): The education record ID

**Request Body:** None

**Response:**

```json
{
  "message": "Education record deleted successfully",
  "success": true
}
```

**Error Responses:**

- `401 Unauthorized`: User not authenticated
- `403 Forbidden`: User is not a doctor or doesn't own the education record
- `404 Not Found`: Education record not found

**Notes:**

- You can only delete education records that belong to your doctor account
- This action is permanent and cannot be undone
- Deleting an education record does not affect other education records or the doctor's profile
- The doctor profile and other records remain intact

---

## Usage Examples

### Frontend: Get Complete Profile

```typescript
async function getCompleteProfile(token: string) {
  const response = await fetch('/api/doctor/profile/complete', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to get complete profile')
  }

  const data = await response.json()
  return data.data // Complete profile object
}
```

### Frontend: Update Profile

```typescript
async function updateProfile(token: string, profileData: {
  professional_contact?: string
  professional_email?: string
  image?: string | null
  gender?: string | null
  dateOfBirth?: string | null
  phone?: string | null
  address?: string | null
}) {
  const response = await fetch('/api/doctor/profile', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profileData),
  })

  if (!response.ok) {
    throw new Error('Failed to update profile')
  }

  const data = await response.json()
  return data.data
}
```

### Frontend: Add Education Record

```typescript
async function addEducation(token: string, education: {
  degree: string
  startYear: string
  endYear?: string | null
  document?: string | null
  institution_name: string
}) {
  const response = await fetch('/api/doctor/profile/education', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(education),
  })

  if (!response.ok) {
    throw new Error('Failed to add education record')
  }

  const data = await response.json()
  return data.data
}
```

### Frontend: Delete Education Record

```typescript
async function deleteEducation(token: string, educationId: string) {
  const response = await fetch(`/api/doctor/profile/education/${educationId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to delete education record')
  }

  const data = await response.json()
  return data
}
```

---

## Data Models

### Complete Doctor Profile Object

```typescript
{
  doctor: DoctorBasicInfo
  education: Education[]
  professionalExperience: ProfessionalExperience | null
  documents: Documents | null
}
```

### Doctor Basic Info Object

```typescript
{
  id: string
  userid: string
  professional_contact: string
  professional_email: string
  secondary_contact: string | null
  isAvailable: boolean
  isInMeeting: boolean
  createdAt: string // ISO 8601 datetime
  updatedAt: string // ISO 8601 datetime
  user: {
    id: string
    name: string
    email: string
    image: string | null // Signed S3 URL
    role: string | null
    isAnonymous: boolean | null
    employeeCode: string | null
    userInfo: {
      id: string
      userId: string
      gender: string | null
      dateOfBirth: string | null // ISO 8601 datetime
      phone: string | null
      address: string | null
      createdAt: string // ISO 8601 datetime
      updatedAt: string // ISO 8601 datetime
    } | null
  }
}
```

### Education Object

```typescript
{
  id: string
  doctorId: string
  degree: string
  startYear: string // ISO 8601 datetime
  endYear: string | null // ISO 8601 datetime
  document: string | null // Signed S3 URL
  institution_name: string
  createdAt: string // ISO 8601 datetime
  updatedAt: string // ISO 8601 datetime
}
```

### Professional Experience Object

```typescript
{
  id: string
  doctorId: string
  age_group: string
  languages: string[]
  profession: string
  special_interest_area: string
  createdAt: string // ISO 8601 datetime
  updatedAt: string // ISO 8601 datetime
}
```

### Documents Object

```typescript
{
  id: string
  doctorId: string
  resume: string | null // Signed S3 URL
  medicalLicense: string | null // Signed S3 URL
  introductionVideo: string | null // Signed S3 URL
  createdAt: string // ISO 8601 datetime
  updatedAt: string // ISO 8601 datetime
}
```

---

## Important Notes

1. **Signed URLs**: All file URLs (images, documents, videos) are automatically converted to signed S3 URLs with a 7-day expiry period. These URLs can be used directly to access the files.

2. **Partial Updates**: For update endpoints, only fields provided in the request body will be updated. Existing values are preserved for fields not included.

3. **Education Records**: Doctors can have multiple education records. Each record can be added, updated, or deleted individually without affecting other records.

4. **Professional Experience**: Each doctor has only one professional experience record. Use the update endpoint to modify it.

5. **Documents**: Each doctor has only one documents record. Use the update endpoint to modify it.

6. **Authentication**: All endpoints require a valid authentication token and the user must have the `doctor` role.

7. **Error Handling**: All endpoints return consistent error responses with appropriate HTTP status codes and error messages.

8. **Data Validation**: All input data is validated according to the schema definitions. Invalid data will result in a `422 Unprocessable Entity` response.

---

## Related APIs

- **Education APIs**: `/api/education` - Additional endpoints for managing education records (bulk create, get all, get by ID, update, delete)
- **Doctor Profile APIs**: `/api/doctor-profile` - Endpoints for managing professional experience and documents together
- **Doctor APIs**: `/api/doctor` - Basic doctor information endpoints


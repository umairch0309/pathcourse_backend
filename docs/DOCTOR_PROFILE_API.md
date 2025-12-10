# Doctor Profile API Documentation

This document describes the Doctor Profile API endpoints for managing professional experience and documents in a single unified endpoint.

## Overview

The Doctor Profile API allows doctors to create, update, and retrieve their professional experience information and documents (resume, medical license, and introduction video) in a single API call. This unified approach simplifies the profile management process by handling both related entities together.

## Base URL

All endpoints are prefixed with `/api`

## Authentication

All endpoints require authentication. Include the authentication token in the request headers:

```
Authorization: Bearer <token>
```

**Note:** Only users with the `doctor` role can access these endpoints.

## Endpoints

### 1. Create or Update Doctor Profile

Create or update both professional experience and documents in a single request. This endpoint uses upsert logic - it will create the records if they don't exist, or update them if they do.

**Endpoint:** `POST /api/doctor-profile`

**Authentication:** Required (Doctor role only)

**Request Body:**

```json
{
  "professionalExperience": {
    "age_group": "string (required, max 100 characters)",
    "languages": ["string"] (required, array of strings, minimum 1 language)",
    "profession": "string (required)",
    "special_interest_area": "string (required)"
  },
  "documents": {
    "resume": "string (optional, URL, max 500 characters)",
    "medicalLicense": "string (optional, URL, max 500 characters)",
    "introductionVideo": "string (optional, URL, max 500 characters, 20-30 second video)"
  }
}
```

**Example Request:**

```json
{
  "professionalExperience": {
    "age_group": "Adults (18-65)",
    "languages": ["English", "Spanish", "French"],
    "profession": "Cardiologist",
    "special_interest_area": "Heart Disease Prevention and Treatment"
  },
  "documents": {
    "resume": "https://example.com/storage/resumes/doctor123_resume.pdf",
    "medicalLicense": "https://example.com/storage/licenses/doctor123_license.pdf",
    "introductionVideo": "https://example.com/storage/videos/doctor123_intro.mp4"
  }
}
```

**Success Response (200 OK):**

```json
{
  "message": "Doctor profile created or updated successfully",
  "success": true,
  "data": {
    "professionalExperience": {
      "id": "exp_id",
      "doctorId": "doctor_id",
      "age_group": "Adults (18-65)",
      "languages": ["English", "Spanish", "French"],
      "profession": "Cardiologist",
      "special_interest_area": "Heart Disease Prevention and Treatment",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    },
    "documents": {
      "id": "doc_id",
      "doctorId": "doctor_id",
      "resume": "https://example.com/storage/resumes/doctor123_resume.pdf",
      "medicalLicense": "https://example.com/storage/licenses/doctor123_license.pdf",
      "introductionVideo": "https://example.com/storage/videos/doctor123_intro.mp4",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  }
}
```

**Error Responses:**

- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - User is not a doctor
- `404 Not Found` - Doctor information not found
- `422 Unprocessable Entity` - Validation errors

**Notes:**

- The endpoint creates or updates both professional experience and documents in parallel
- If either record already exists for the doctor, it will be updated
- All document fields are optional - you can provide any combination of resume, medicalLicense, and introductionVideo
- The `languages` field must contain at least one language
- Document URLs must be valid URLs

---

### 2. Get Current Doctor Profile

Retrieve the authenticated doctor's professional experience and documents.

**Endpoint:** `GET /api/doctor-profile`

**Authentication:** Required (Doctor role only)

**Request Body:** None

**Success Response (200 OK):**

```json
{
  "message": "Doctor profile retrieved successfully",
  "success": true,
  "data": {
    "professionalExperience": {
      "id": "exp_id",
      "doctorId": "doctor_id",
      "age_group": "Adults (18-65)",
      "languages": ["English", "Spanish", "French"],
      "profession": "Cardiologist",
      "special_interest_area": "Heart Disease Prevention and Treatment",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    },
    "documents": {
      "id": "doc_id",
      "doctorId": "doctor_id",
      "resume": "https://example.com/storage/resumes/doctor123_resume.pdf",
      "medicalLicense": "https://example.com/storage/licenses/doctor123_license.pdf",
      "introductionVideo": "https://example.com/storage/videos/doctor123_intro.mp4",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  }
}
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - User is not a doctor
- `404 Not Found` - Doctor profile not found (either professional experience or documents missing)

**Notes:**

- Both professional experience and documents must exist for the doctor
- If either is missing, a 404 error will be returned
- The response includes both entities together

---

## Data Models

### Professional Experience Object

```typescript
{
  id: string                    // Professional experience record ID
  doctorId: string              // Associated doctor ID
  age_group: string             // Age group the doctor serves (max 100 chars)
  languages: string[]           // Array of languages the doctor speaks (min 1)
  profession: string             // Doctor profession/specialty
  special_interest_area: string  // Special interest area
  createdAt: string             // ISO 8601 datetime
  updatedAt: string             // ISO 8601 datetime
}
```

### Documents Object

```typescript
{
  id: string                    // Documents record ID
  doctorId: string              // Associated doctor ID
  resume: string | null         // Resume document URL (optional)
  medicalLicense: string | null  // Medical license document URL (optional)
  introductionVideo: string | null // 20-30 second introduction video URL (optional)
  createdAt: string             // ISO 8601 datetime
  updatedAt: string             // ISO 8601 datetime
}
```

### Doctor Profile Response

```typescript
{
  professionalExperience: ProfessionalExperienceObject
  documents: DocumentsObject
}
```

---

## Field Descriptions

### Professional Experience Fields

- **age_group** (required): The age group(s) the doctor serves. Examples: "Children (0-18)", "Adults (18-65)", "Seniors (65+)", "All Ages"
- **languages** (required, array): List of languages the doctor speaks. Must contain at least one language. Examples: ["English", "Spanish"], ["English", "French", "German"]
- **profession** (required): The doctor's profession or specialty. Examples: "Cardiologist", "Pediatrician", "General Practitioner"
- **special_interest_area** (required): The doctor's special interest area or focus. Examples: "Heart Disease Prevention", "Child Development", "Mental Health"

### Documents Fields

- **resume** (optional): URL to the doctor's resume/CV document. Must be a valid URL and max 500 characters.
- **medicalLicense** (optional): URL to the doctor's medical license document (if applicable). Must be a valid URL and max 500 characters.
- **introductionVideo** (optional): URL to a 20-30 second introduction video for users. Must be a valid URL and max 500 characters. This video helps patients get to know the doctor before booking an appointment.

---

## Usage Examples

### Example 1: Create Complete Doctor Profile

```bash
curl -X POST https://api.example.com/api/doctor-profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "professionalExperience": {
      "age_group": "Adults (18-65)",
      "languages": ["English", "Spanish"],
      "profession": "Cardiologist",
      "special_interest_area": "Heart Disease Prevention"
    },
    "documents": {
      "resume": "https://example.com/resume.pdf",
      "medicalLicense": "https://example.com/license.pdf",
      "introductionVideo": "https://example.com/video.mp4"
    }
  }'
```

### Example 2: Update Only Professional Experience

```bash
curl -X POST https://api.example.com/api/doctor-profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "professionalExperience": {
      "age_group": "All Ages",
      "languages": ["English", "Spanish", "French"],
      "profession": "General Practitioner",
      "special_interest_area": "Family Medicine"
    },
    "documents": {
      "resume": null,
      "medicalLicense": null,
      "introductionVideo": null
    }
  }'
```

### Example 3: Update Only Documents

```bash
curl -X POST https://api.example.com/api/doctor-profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "professionalExperience": {
      "age_group": "Adults (18-65)",
      "languages": ["English"],
      "profession": "Cardiologist",
      "special_interest_area": "Heart Disease"
    },
    "documents": {
      "resume": "https://example.com/new_resume.pdf",
      "medicalLicense": "https://example.com/new_license.pdf",
      "introductionVideo": "https://example.com/new_video.mp4"
    }
  }'
```

### Example 4: Get Current Doctor Profile

```bash
curl -X GET https://api.example.com/api/doctor-profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Example 5: Update with Partial Documents

```bash
curl -X POST https://api.example.com/api/doctor-profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "professionalExperience": {
      "age_group": "Adults (18-65)",
      "languages": ["English", "Spanish"],
      "profession": "Cardiologist",
      "special_interest_area": "Heart Disease Prevention"
    },
    "documents": {
      "resume": "https://example.com/resume.pdf",
      "medicalLicense": null,
      "introductionVideo": "https://example.com/video.mp4"
    }
  }'
```

---

## Validation Rules

### Professional Experience Validation

- `age_group`: Required, must be a non-empty string, maximum 100 characters
- `languages`: Required, must be an array with at least one string element
- `profession`: Required, must be a non-empty string
- `special_interest_area`: Required, must be a non-empty string

### Documents Validation

- `resume`: Optional, if provided must be a valid URL, maximum 500 characters
- `medicalLicense`: Optional, if provided must be a valid URL, maximum 500 characters
- `introductionVideo`: Optional, if provided must be a valid URL, maximum 500 characters

---

## Error Handling

### Common Error Scenarios

1. **Missing Authentication Token**
   - Status: `401 Unauthorized`
   - Response: `{ "message": "Unauthorized", "success": false }`

2. **User is Not a Doctor**
   - Status: `403 Forbidden`
   - Response: `{ "message": "Only doctors can access this endpoint", "success": false }`

3. **Doctor Record Not Found**
   - Status: `404 Not Found`
   - Response: `{ "message": "Doctor information not found", "success": false }`

4. **Validation Errors**
   - Status: `422 Unprocessable Entity`
   - Response: Contains detailed validation error messages for each invalid field

5. **Profile Not Found (GET endpoint)**
   - Status: `404 Not Found`
   - Response: `{ "message": "Professional experience not found" }` or `{ "message": "Documents not found" }`

---

## Integration Notes

### Why a Single Endpoint?

The Doctor Profile API combines Professional Experience and Documents into a single endpoint for several reasons:

1. **Atomicity**: Both entities are created/updated together, ensuring data consistency
2. **Simplicity**: Reduces the number of API calls needed to set up a complete doctor profile
3. **Relationship**: Professional Experience and Documents are closely related and often updated together
4. **Performance**: Parallel processing of both entities improves response time

### Database Relationships

- Each doctor can have **one** Professional Experience record (1:1 relationship)
- Each doctor can have **one** Documents record (1:1 relationship)
- Both are linked to the Doctor model via `doctorId` with cascade delete

### Upsert Behavior

The API uses upsert logic:
- If a record doesn't exist, it will be created
- If a record exists, it will be updated with the new values
- This allows the same endpoint to be used for both initial creation and updates

---

## Best Practices

1. **Always provide complete data**: Even when updating, provide both `professionalExperience` and `documents` objects
2. **Validate URLs**: Ensure document URLs are accessible and point to valid files
3. **Video requirements**: Introduction videos should be 20-30 seconds for optimal user experience
4. **Language array**: Include all languages the doctor speaks, not just the primary one
5. **Error handling**: Always check for error responses and handle them appropriately in your client application

---

## Related APIs

- **Doctor API** (`/api/doctor`): Manage basic doctor information (contact details, availability)
- **Education API** (`/api/education`): Manage doctor's educational background
- **Files API**: Upload files to get URLs for use in the documents fields

---

## Changelog

### Version 1.0.0 (Initial Release)
- Added `POST /api/doctor-profile` endpoint for creating/updating doctor profile
- Added `GET /api/doctor-profile` endpoint for retrieving doctor profile
- Support for Professional Experience with languages array
- Support for Documents with resume, medical license, and introduction video

---

## Support

For issues or questions regarding this API, please contact the development team or refer to the main API documentation.


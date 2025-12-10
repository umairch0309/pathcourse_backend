# Doctor API Documentation

This document describes the Doctor API endpoints for managing doctor profiles and information.

## Overview

The Doctor API allows doctors to create, update, and retrieve their professional information. It also supports updating user information (gender, date of birth, phone, address) and profile image in the same request.

## Base URL

All endpoints are prefixed with `/api`

## Authentication

Most endpoints require authentication. Include the authentication token in the request headers:
```
Authorization: Bearer <token>
```

## Endpoints

### 1. Create or Update Doctor Information

Create or update doctor professional information. This endpoint also allows updating user info and profile image in the same request.

**Endpoint:** `POST /api/doctor`

**Authentication:** Required (Doctor role only)

**Request Body:**

```json
{
  "professional_contact": "string (required)",
  "professional_email": "string (required, must be valid email)",
  "about": "string (required)",
  "image": "string (optional, URL)",
  "gender": "string (optional, max 20 characters)",
  "dateOfBirth": "string (optional, ISO 8601 datetime format)",
  "phone": "string (optional, max 50 characters)",
  "address": "string (optional)"
}
```

**Example Request:**

```json
{
  "professional_contact": "+1234567890",
  "professional_email": "doctor@example.com",
  "about": "Experienced cardiologist with 10 years of practice",
  "image": "https://example.com/profile.jpg",
  "gender": "male",
  "dateOfBirth": "1980-01-15T00:00:00.000Z",
  "phone": "+1234567890",
  "address": "123 Medical Center, City, State"
}
```

**Success Response (200 OK):**

```json
{
  "message": "Doctor information created or updated successfully",
  "success": true,
  "data": {
    "id": "doctor_id",
    "userid": "user_id",
    "professional_contact": "+1234567890",
    "professional_email": "doctor@example.com",
    "about": "Experienced cardiologist with 10 years of practice",
    "isAvailable": false,
    "isInMeeting": false,
    "availableDurations": [15, 30, 45, 60],
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z",
    "user": {
      "id": "user_id",
      "name": "Dr. John Doe",
      "email": "user@example.com",
      "image": "https://example.com/profile.jpg",
      "role": "doctor"
    }
  }
}
```

**Error Responses:**

- `400 Bad Request` - Invalid request data or professional email already exists
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - User is not a doctor
- `422 Unprocessable Entity` - Validation errors

**Notes:**

- If `professional_email` already exists for another doctor, the request will fail
- The `image` field updates the user's profile image
- User info fields (`gender`, `dateOfBirth`, `phone`, `address`) are optional and will update/create UserInfo record if provided
- The endpoint uses upsert logic - it will create if doesn't exist, or update if it does

---

### 2. Get Current Doctor Information

Retrieve the authenticated doctor's own information.

**Endpoint:** `GET /api/doctor`

**Authentication:** Required (Doctor role only)

**Request Body:** None

**Success Response (200 OK):**

```json
{
  "message": "Doctor information retrieved successfully",
  "success": true,
  "data": {
    "id": "doctor_id",
    "userid": "user_id",
    "professional_contact": "+1234567890",
    "professional_email": "doctor@example.com",
    "about": "Experienced cardiologist with 10 years of practice",
    "isAvailable": false,
    "isInMeeting": false,
    "availableDurations": [15, 30, 45, 60],
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z",
    "user": {
      "id": "user_id",
      "name": "Dr. John Doe",
      "email": "user@example.com",
      "image": "https://example.com/profile.jpg",
      "role": "doctor"
    }
  }
}
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - User is not a doctor
- `404 Not Found` - Doctor information not found

---

### 3. Get Doctor by ID

Retrieve doctor information by doctor ID. This is a public endpoint (no authentication required).

**Endpoint:** `GET /api/doctor/{id}`

**Authentication:** Not required

**Path Parameters:**

- `id` (string, required) - The doctor's ID

**Success Response (200 OK):**

```json
{
  "message": "Doctor information retrieved successfully",
  "success": true,
  "data": {
    "id": "doctor_id",
    "userid": "user_id",
    "professional_contact": "+1234567890",
    "professional_email": "doctor@example.com",
    "about": "Experienced cardiologist with 10 years of practice",
    "isAvailable": false,
    "isInMeeting": false,
    "availableDurations": [15, 30, 45, 60],
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z",
    "user": {
      "id": "user_id",
      "name": "Dr. John Doe",
      "email": "user@example.com",
      "image": "https://example.com/profile.jpg",
      "role": "doctor"
    }
  }
}
```

**Error Responses:**

- `404 Not Found` - Doctor not found

---

## Data Models

### Doctor Object

```typescript
{
  id: string                    // Doctor record ID
  userid: string                // Associated user ID
  professional_contact: string  // Professional contact number
  professional_email: string     // Professional email (unique)
  about: string                  // Doctor's bio/description
  isAvailable: boolean           // Availability status
  isInMeeting: boolean           // Meeting status
  availableDurations: number[]   // Available appointment durations in minutes
  createdAt: string             // ISO 8601 datetime
  updatedAt: string             // ISO 8601 datetime
  user: {                       // Related user object
    id: string
    name: string
    email: string
    image: string | null
    role: string | null
  }
}
```

---

## Usage Examples

### Example 1: Create Doctor Profile with User Info

```bash
curl -X POST https://api.example.com/api/doctor \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "professional_contact": "+1234567890",
    "professional_email": "doctor@example.com",
    "about": "Experienced cardiologist",
    "image": "https://example.com/profile.jpg",
    "gender": "male",
    "dateOfBirth": "1980-01-15T00:00:00.000Z",
    "phone": "+1234567890",
    "address": "123 Medical Center"
  }'
```

### Example 2: Update Only Professional Information

```bash
curl -X POST https://api.example.com/api/doctor \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "professional_contact": "+1234567890",
    "professional_email": "doctor@example.com",
    "about": "Updated bio information"
  }'
```

### Example 3: Get Current Doctor Information

```bash
curl -X GET https://api.example.com/api/doctor \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Example 4: Get Doctor by ID (Public)

```bash
curl -X GET https://api.example.com/api/doctor/doctor_id_here
```

---

## Important Notes

1. **Professional Email Uniqueness**: The `professional_email` must be unique across all doctors. If you try to use an email that's already registered, you'll receive a 400 Bad Request error.

2. **User Info Updates**: When you provide user info fields (`gender`, `dateOfBirth`, `phone`, `address`), the system will automatically create or update the UserInfo record associated with your account.

3. **Profile Image**: The `image` field updates the user's profile image, which is stored in the User model, not the Doctor model.

4. **Role Requirement**: Only users with the `doctor` role can create or update doctor information. Other roles will receive a 403 Forbidden error.

5. **Upsert Behavior**: The create/update endpoint uses upsert logic - if a doctor record exists for the user, it will be updated; otherwise, a new record will be created.

6. **Date Format**: All datetime fields should be in ISO 8601 format (UTC), e.g., `2024-01-15T10:00:00.000Z`.

---

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "error": {
    "name": "ErrorName",
    "message": "Error message description"
  }
}
```

Common error scenarios:

- **Validation Errors (422)**: Request body doesn't match the expected schema
- **Unauthorized (401)**: Missing or invalid authentication token
- **Forbidden (403)**: User doesn't have the required role (doctor)
- **Not Found (404)**: Requested resource doesn't exist
- **Bad Request (400)**: Invalid data (e.g., duplicate professional email)


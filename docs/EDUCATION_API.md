# Education API Documentation

This document describes the Education API endpoints for managing doctor education records.

## Overview

The Education API allows doctors to manage their educational qualifications. It supports bulk creation of multiple education records in a single request, making it efficient to add multiple degrees or qualifications at once.

## Base URL

All endpoints are prefixed with `/api`

## Authentication

Most endpoints require authentication. Include the authentication token in the request headers:
```
Authorization: Bearer <token>
```

## Endpoints

### 1. Bulk Create Education Records

Create multiple education records in a single request. This is useful when adding multiple degrees or qualifications.

**Endpoint:** `POST /api/education`

**Authentication:** Required (Doctor role only)

**Request Body:**

```json
{
  "educations": [
    {
      "degree": "string (required, max 100 characters)",
      "startYear": "string (required, ISO 8601 datetime format)",
      "endYear": "string (optional, ISO 8601 datetime format)",
      "document": "string (optional, URL, max 500 characters)",
      "institute_address": "string (required, max 200 characters)",
      "institution_name": "string (required, max 200 characters)"
    }
  ]
}
```

**Example Request:**

```json
{
  "educations": [
    {
      "degree": "Doctor of Medicine (MD)",
      "startYear": "2010-09-01T00:00:00.000Z",
      "endYear": "2014-06-30T00:00:00.000Z",
      "document": "https://example.com/certificates/md-certificate.pdf",
      "institute_address": "123 Medical School Avenue, City, State 12345",
      "institution_name": "Harvard Medical School"
    },
    {
      "degree": "Bachelor of Science in Biology",
      "startYear": "2006-09-01T00:00:00.000Z",
      "endYear": "2010-05-15T00:00:00.000Z",
      "document": "https://example.com/certificates/bs-biology.pdf",
      "institute_address": "456 University Boulevard, City, State 12345",
      "institution_name": "State University"
    },
    {
      "degree": "Residency in Cardiology",
      "startYear": "2014-07-01T00:00:00.000Z",
      "endYear": "2017-06-30T00:00:00.000Z",
      "document": null,
      "institute_address": "789 Hospital Drive, City, State 12345",
      "institution_name": "City General Hospital"
    }
  ]
}
```

**Success Response (201 Created):**

```json
{
  "message": "Successfully created 3 education record(s)",
  "success": true,
  "data": {
    "educations": [
      {
        "id": "education_id_1",
        "doctorId": "doctor_id",
        "degree": "Doctor of Medicine (MD)",
        "startYear": "2010-09-01T00:00:00.000Z",
        "endYear": "2014-06-30T00:00:00.000Z",
        "document": "https://example.com/certificates/md-certificate.pdf",
        "institute_address": "123 Medical School Avenue, City, State 12345",
        "institution_name": "Harvard Medical School",
        "createdAt": "2024-01-15T10:00:00.000Z",
        "updatedAt": "2024-01-15T10:00:00.000Z"
      },
      {
        "id": "education_id_2",
        "doctorId": "doctor_id",
        "degree": "Bachelor of Science in Biology",
        "startYear": "2006-09-01T00:00:00.000Z",
        "endYear": "2010-05-15T00:00:00.000Z",
        "document": "https://example.com/certificates/bs-biology.pdf",
        "institute_address": "456 University Boulevard, City, State 12345",
        "institution_name": "State University",
        "createdAt": "2024-01-15T10:00:00.000Z",
        "updatedAt": "2024-01-15T10:00:00.000Z"
      },
      {
        "id": "education_id_3",
        "doctorId": "doctor_id",
        "degree": "Residency in Cardiology",
        "startYear": "2014-07-01T00:00:00.000Z",
        "endYear": "2017-06-30T00:00:00.000Z",
        "document": null,
        "institute_address": "789 Hospital Drive, City, State 12345",
        "institution_name": "City General Hospital",
        "createdAt": "2024-01-15T10:00:00.000Z",
        "updatedAt": "2024-01-15T10:00:00.000Z"
      }
    ]
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

- The `educations` array must contain at least one item
- All education records will be created for the authenticated doctor
- The `endYear` can be `null` for ongoing education
- The `document` field should be a URL to the certificate or document
- All datetime fields should be in ISO 8601 format (UTC)

---

### 2. Get All Education Records

Retrieve all education records for the authenticated doctor.

**Endpoint:** `GET /api/education`

**Authentication:** Required (Doctor role only)

**Request Body:** None

**Success Response (200 OK):**

```json
{
  "message": "Education records retrieved successfully",
  "success": true,
  "data": {
    "educations": [
      {
        "id": "education_id_1",
        "doctorId": "doctor_id",
        "degree": "Doctor of Medicine (MD)",
        "startYear": "2010-09-01T00:00:00.000Z",
        "endYear": "2014-06-30T00:00:00.000Z",
        "document": "https://example.com/certificates/md-certificate.pdf",
        "institute_address": "123 Medical School Avenue, City, State 12345",
        "institution_name": "Harvard Medical School",
        "createdAt": "2024-01-15T10:00:00.000Z",
        "updatedAt": "2024-01-15T10:00:00.000Z"
      }
    ]
  }
}
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - User is not a doctor
- `404 Not Found` - Doctor information not found

**Notes:**

- Records are returned sorted by `startYear` in descending order (most recent first)
- Returns an empty array if no education records exist

---

### 3. Get Education Record by ID

Retrieve a specific education record by its ID. This is a public endpoint (no authentication required).

**Endpoint:** `GET /api/education/{id}`

**Authentication:** Not required

**Path Parameters:**

- `id` (string, required) - The education record ID

**Success Response (200 OK):**

```json
{
  "message": "Education record retrieved successfully",
  "success": true,
  "data": {
    "id": "education_id",
    "doctorId": "doctor_id",
    "degree": "Doctor of Medicine (MD)",
    "startYear": "2010-09-01T00:00:00.000Z",
    "endYear": "2014-06-30T00:00:00.000Z",
    "document": "https://example.com/certificates/md-certificate.pdf",
    "institute_address": "123 Medical School Avenue, City, State 12345",
    "institution_name": "Harvard Medical School",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Error Responses:**

- `404 Not Found` - Education record not found

---

### 4. Update Education Record

Update an existing education record. Only the doctor who owns the record can update it.

**Endpoint:** `PUT /api/education/{id}`

**Authentication:** Required (Doctor role only)

**Path Parameters:**

- `id` (string, required) - The education record ID

**Request Body:**

```json
{
  "degree": "string (optional, max 100 characters)",
  "startYear": "string (optional, ISO 8601 datetime format)",
  "endYear": "string (optional, ISO 8601 datetime format, can be null)",
  "document": "string (optional, URL, max 500 characters, can be null)",
  "institute_address": "string (optional, max 200 characters)",
  "institution_name": "string (optional, max 200 characters)"
}
```

**Example Request:**

```json
{
  "degree": "Doctor of Medicine (MD) - Updated",
  "endYear": "2015-06-30T00:00:00.000Z",
  "document": "https://example.com/certificates/updated-certificate.pdf"
}
```

**Success Response (200 OK):**

```json
{
  "message": "Education record updated successfully",
  "success": true,
  "data": {
    "id": "education_id",
    "doctorId": "doctor_id",
    "degree": "Doctor of Medicine (MD) - Updated",
    "startYear": "2010-09-01T00:00:00.000Z",
    "endYear": "2015-06-30T00:00:00.000Z",
    "document": "https://example.com/certificates/updated-certificate.pdf",
    "institute_address": "123 Medical School Avenue, City, State 12345",
    "institution_name": "Harvard Medical School",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:05:00.000Z"
  }
}
```

**Error Responses:**

- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - User is not a doctor or doesn't own the education record
- `404 Not Found` - Education record not found
- `422 Unprocessable Entity` - Validation errors

**Notes:**

- Only fields provided in the request body will be updated
- You can only update education records that belong to your doctor account
- To set `endYear` or `document` to `null`, explicitly pass `null` in the request

---

### 5. Delete Education Record

Delete an education record. Only the doctor who owns the record can delete it.

**Endpoint:** `DELETE /api/education/{id}`

**Authentication:** Required (Doctor role only)

**Path Parameters:**

- `id` (string, required) - The education record ID

**Request Body:** None

**Success Response (200 OK):**

```json
{
  "message": "Education record deleted successfully",
  "success": true
}
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - User is not a doctor or doesn't own the education record
- `404 Not Found` - Education record not found

**Notes:**

- You can only delete education records that belong to your doctor account
- This action is permanent and cannot be undone

---

## Data Models

### Education Object

```typescript
{
  id: string                    // Education record ID
  doctorId: string              // Associated doctor ID
  degree: string                 // Degree or qualification name (max 100 chars)
  startYear: string             // Start year in ISO 8601 format
  endYear: string | null        // End year in ISO 8601 format (null for ongoing)
  document: string | null       // Document URL (max 500 chars, optional)
  institute_address: string     // Institute address (max 200 chars)
  institution_name: string      // Institution name (max 200 chars)
  createdAt: string             // Creation timestamp in ISO 8601 format
  updatedAt: string             // Last update timestamp in ISO 8601 format
}
```

---

## Usage Examples

### Example 1: Bulk Create Multiple Education Records

```bash
curl -X POST https://api.example.com/api/education \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "educations": [
      {
        "degree": "Doctor of Medicine (MD)",
        "startYear": "2010-09-01T00:00:00.000Z",
        "endYear": "2014-06-30T00:00:00.000Z",
        "document": "https://example.com/certificates/md.pdf",
        "institute_address": "123 Medical School Ave",
        "institution_name": "Harvard Medical School"
      },
      {
        "degree": "Residency in Cardiology",
        "startYear": "2014-07-01T00:00:00.000Z",
        "endYear": "2017-06-30T00:00:00.000Z",
        "document": null,
        "institute_address": "789 Hospital Drive",
        "institution_name": "City General Hospital"
      }
    ]
  }'
```

### Example 2: Get All Education Records

```bash
curl -X GET https://api.example.com/api/education \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Example 3: Get Education Record by ID (Public)

```bash
curl -X GET https://api.example.com/api/education/education_id_here
```

### Example 4: Update Education Record

```bash
curl -X PUT https://api.example.com/api/education/education_id_here \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "degree": "Doctor of Medicine (MD) - Updated",
    "endYear": "2015-06-30T00:00:00.000Z"
  }'
```

### Example 5: Delete Education Record

```bash
curl -X DELETE https://api.example.com/api/education/education_id_here \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Important Notes

1. **Bulk Create**: The bulk create endpoint allows you to create multiple education records in a single API call, which is more efficient than creating them one by one.

2. **Ownership Validation**: When updating or deleting education records, the system verifies that the record belongs to the authenticated doctor. Attempting to modify records belonging to other doctors will result in a 403 Forbidden error.

3. **Date Format**: All datetime fields (`startYear`, `endYear`) should be in ISO 8601 format (UTC), e.g., `2024-01-15T10:00:00.000Z`.

4. **Ongoing Education**: If an education is still ongoing, set `endYear` to `null` or omit it from the request.

5. **Document URLs**: The `document` field should contain a URL to the certificate or document. This could be a link to a file stored in S3 or any other file hosting service.

6. **Field Lengths**:
   - `degree`: Maximum 100 characters
   - `institute_address`: Maximum 200 characters
   - `institution_name`: Maximum 200 characters
   - `document`: Maximum 500 characters (URL length)

7. **Sorting**: When retrieving all education records, they are sorted by `startYear` in descending order (most recent first).

8. **Role Requirement**: Only users with the `doctor` role can create, update, or delete education records. Other roles will receive a 403 Forbidden error.

9. **Transaction Safety**: The bulk create operation uses database transactions, ensuring that either all records are created successfully or none are created if an error occurs.

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
- **Forbidden (403)**: User doesn't have the required role (doctor) or doesn't own the resource
- **Not Found (404)**: Requested resource doesn't exist
- **Bad Request (400)**: Invalid data or business logic violation

---

## Best Practices

1. **Bulk Operations**: Use the bulk create endpoint when adding multiple education records to reduce the number of API calls.

2. **Document Storage**: Store education certificates/documents in a file storage service (like S3) and provide the URL in the `document` field.

3. **Date Consistency**: Always use UTC timezone for all datetime fields to avoid timezone-related issues.

4. **Validation**: Validate all input data on the client side before making API calls to provide better user experience.

5. **Error Handling**: Implement proper error handling in your application to gracefully handle API errors and display appropriate messages to users.


# Appointment Fetch APIs Documentation

This document describes the APIs for fetching appointments with full doctor and patient details, including filtering by status (BOOKED, COMPLETED, NO_SHOW).

## Overview

The appointment fetch APIs provide comprehensive access to appointment data with complete doctor and patient information. These endpoints support filtering by appointment status and return full object details including doctor profiles, education, documents, and patient information.

## Key Features

1. **Full Object Details**: Returns complete doctor and patient objects with all related data
2. **Status Filtering**: Filter appointments by status (BOOKED, COMPLETED, NO_SHOW)
3. **Role-Based Access**: Separate endpoints for patients and doctors
4. **Pagination**: Built-in pagination support for large result sets
5. **Signed URLs**: All S3 documents and images are returned as signed URLs

## API Endpoints

### 1. Get Appointment by ID with Full Details

**Endpoint**: `GET /api/appointment/{id}/full`

**Authentication**: Required

**Description**: Retrieve a single appointment by ID with complete doctor and patient details including:
- Doctor profile, documents, education, professional experience
- Patient user info
- All appointment details

**Path Parameters**:
- `id`: Appointment ID

**Response**:
```json
{
  "message": "Appointment with full details retrieved successfully",
  "success": true,
  "data": {
    "id": "appointment_id",
    "doctorId": "doctor_user_id",
    "patientId": "patient_user_id",
    "status": "BOOKED",
    "scheduledAt": "2026-01-14T10:00:00.000Z",
    "startedAt": null,
    "endedAt": null,
    "createdAt": "2026-01-14T09:45:00.000Z",
    "updatedAt": "2026-01-14T09:45:00.000Z",
    "chatroomExpiry": null,
    "age": 30,
    "appointmentFor": "self",
    "issue": "Anxiety and stress management",
    "uploadId": null,
    "relationWithPatient": null,
    "patientName": null,
    "patientAge": null,
    "doctor": {
      "id": "doctor_user_id",
      "name": "Dr. John Smith",
      "email": "doctor@example.com",
      "image": "https://signed-url-to-image.jpg",
      "role": "doctor",
      "isAnonymous": false,
      "employeeCode": null,
      "userInfo": {
        "id": "user_info_id",
        "userId": "doctor_user_id",
        "gender": "Male",
        "dateOfBirth": "1980-05-15T00:00:00.000Z",
        "phone": "+1234567890",
        "address": "123 Medical St"
      },
      "doctor": {
        "id": "doctor_profile_id",
        "userid": "doctor_user_id",
        "professional_contact": "+1234567890",
        "professional_email": "professional@example.com",
        "about": "Experienced therapist specializing in mental health",
        "isAvailable": true,
        "isInMeeting": false,
        "availableDurations": [15, 30, 45, 60],
        "documents": {
          "id": "documents_id",
          "resume": "https://signed-url-to-resume.pdf",
          "medicalLicense": "https://signed-url-to-license.pdf",
          "introductionVideo": "https://signed-url-to-video.mp4"
        },
        "education": [
          {
            "id": "education_id",
            "degree": "MD",
            "startYear": "2000-01-01T00:00:00.000Z",
            "endYear": "2004-01-01T00:00:00.000Z",
            "institution_name": "Medical University",
            "document": "https://signed-url-to-degree.pdf"
          }
        ],
        "professionalExperience": [
          {
            "id": "experience_id",
            "position": "Senior Therapist",
            "company": "Health Clinic",
            "startDate": "2010-01-01T00:00:00.000Z",
            "endDate": null,
            "description": "Providing mental health services"
          }
        ]
      }
    },
    "patient": {
      "id": "patient_user_id",
      "name": "Jane Doe",
      "email": "patient@example.com",
      "image": "https://signed-url-to-image.jpg",
      "role": "patient",
      "isAnonymous": false,
      "employeeCode": "EMP12345",
      "userInfo": {
        "id": "patient_user_info_id",
        "userId": "patient_user_id",
        "gender": "Female",
        "dateOfBirth": "1990-03-20T00:00:00.000Z",
        "phone": "+0987654321",
        "address": "456 Patient Ave"
      }
    }
  }
}
```

**Error Responses**:
- `401 Unauthorized`: User not authenticated
- `403 Forbidden`: User does not have access to this appointment
- `404 Not Found`: Appointment not found

**Access Control**:
- Doctors can access appointments where they are the assigned doctor
- Patients can access appointments where they are the patient
- Admins can access any appointment

---

### 2. Get Patient Appointments

**Endpoint**: `GET /api/appointments/patient`

**Authentication**: Required (Patient only)

**Description**: Retrieve all appointments for the authenticated patient with full doctor details. Supports filtering by status.

**Query Parameters**:
- `status` (optional): Filter by appointment status - `BOOKED`, `COMPLETED`, or `NO_SHOW`
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Example Request**:
```
GET /api/appointments/patient?status=BOOKED&page=1&limit=10
```

**Response**:
```json
{
  "message": "Patient appointments retrieved successfully",
  "success": true,
  "data": {
    "appointments": [
      {
        "id": "appointment_id_1",
        "doctorId": "doctor_user_id",
        "patientId": "patient_user_id",
        "status": "BOOKED",
        "scheduledAt": "2026-01-14T10:00:00.000Z",
        "doctor": {
          "id": "doctor_user_id",
          "name": "Dr. John Smith",
          "email": "doctor@example.com",
          "image": "https://signed-url-to-image.jpg",
          "role": "doctor",
          "userInfo": { /* full user info */ },
          "doctor": {
            "id": "doctor_profile_id",
            "professional_contact": "+1234567890",
            "professional_email": "professional@example.com",
            "about": "Experienced therapist",
            "documents": { /* full documents */ },
            "education": [ /* full education array */ ],
            "professionalExperience": [ /* full experience array */ ]
          }
        },
        "patient": {
          "id": "patient_user_id",
          "name": "Jane Doe",
          "email": "patient@example.com",
          "userInfo": { /* full user info */ }
        }
      }
      // ... more appointments
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

**Error Responses**:
- `401 Unauthorized`: User not authenticated
- `403 Forbidden`: Only patients can access this endpoint

**Status Filter Examples**:
- `?status=BOOKED` - Get only booked appointments
- `?status=COMPLETED` - Get only completed appointments
- `?status=NO_SHOW` - Get only missed (no-show) appointments
- No status parameter - Get all appointments

---

### 3. Get Doctor Appointments

**Endpoint**: `GET /api/appointments/doctor`

**Authentication**: Required (Doctor only)

**Description**: Retrieve all appointments for the authenticated doctor with full patient details. Supports filtering by status.

**Query Parameters**:
- `status` (optional): Filter by appointment status - `BOOKED`, `COMPLETED`, or `NO_SHOW`
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Example Request**:
```
GET /api/appointments/doctor?status=COMPLETED&page=1&limit=20
```

**Response**:
```json
{
  "message": "Doctor appointments retrieved successfully",
  "success": true,
  "data": {
    "appointments": [
      {
        "id": "appointment_id_1",
        "doctorId": "doctor_user_id",
        "patientId": "patient_user_id",
        "status": "COMPLETED",
        "scheduledAt": "2026-01-14T10:00:00.000Z",
        "startedAt": "2026-01-14T10:00:05.000Z",
        "endedAt": "2026-01-14T10:15:00.000Z",
        "doctor": {
          "id": "doctor_user_id",
          "name": "Dr. John Smith",
          "email": "doctor@example.com",
          "userInfo": { /* full user info */ },
          "doctor": {
            /* full doctor profile */
          }
        },
        "patient": {
          "id": "patient_user_id",
          "name": "Jane Doe",
          "email": "patient@example.com",
          "image": "https://signed-url-to-image.jpg",
          "role": "patient",
          "isAnonymous": false,
          "employeeCode": "EMP12345",
          "userInfo": {
            "id": "patient_user_info_id",
            "userId": "patient_user_id",
            "gender": "Female",
            "dateOfBirth": "1990-03-20T00:00:00.000Z",
            "phone": "+0987654321",
            "address": "456 Patient Ave"
          }
        }
      }
      // ... more appointments
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

**Error Responses**:
- `401 Unauthorized`: User not authenticated
- `403 Forbidden`: Only doctors can access this endpoint

**Note**: Patient information respects anonymous mode. If a patient has `isAnonymous = true`, their name, email, and image will be hidden (shown as `null`) and only their `employeeCode` will be visible.

---

## Appointment Status Values

- **BOOKED**: Appointment is scheduled and confirmed
- **COMPLETED**: Appointment was successfully completed
- **NO_SHOW**: Patient did not show up for the appointment (missed)

## Full Object Structure

### Doctor Object (Full)

When fetching appointments with full details, the doctor object includes:

```typescript
{
  id: string                    // User ID
  name: string                  // Doctor's full name
  email: string                 // Doctor's email
  image: string | null          // Profile image (signed URL)
  role: string                  // Always "doctor"
  isAnonymous: boolean          // Always false for doctors
  employeeCode: string | null   // Employee code (if applicable)
  userInfo: {                   // UserInfo object
    id: string
    userId: string
    gender: string | null
    dateOfBirth: Date | null
    phone: string | null
    address: string | null
  }
  doctor: {                     // Doctor profile object
    id: string                  // Doctor profile ID
    userid: string              // User ID
    professional_contact: string
    professional_email: string
    about: string | null
    isAvailable: boolean
    isInMeeting: boolean
    availableDurations: number[]
    documents: {                // Documents with signed URLs
      id: string
      resume: string | null
      medicalLicense: string | null
      introductionVideo: string | null
    }
    education: Array<{          // Education history
      id: string
      degree: string
      startYear: Date
      endYear: Date | null
      institution_name: string
      document: string | null   // Signed URL
    }>
    professionalExperience: Array<{  // Professional experience
      id: string
      position: string
      company: string
      startDate: Date
      endDate: Date | null
      description: string | null
    }>
  }
}
```

### Patient Object (Full)

When fetching appointments with full details, the patient object includes:

```typescript
{
  id: string                    // User ID
  name: string | null           // May be null if anonymous
  email: string | null          // May be null if anonymous
  image: string | null          // May be null if anonymous
  role: string                  // Always "patient"
  isAnonymous: boolean
  employeeCode: string | null   // Always visible even when anonymous
  userInfo: {                   // UserInfo object
    id: string
    userId: string
    gender: string | null
    dateOfBirth: Date | null
    phone: string | null
    address: string | null
  }
}
```

**Important**: If `isAnonymous = true`, the `name`, `email`, and `image` fields will be `null` when viewed by someone other than the patient themselves. Only the `employeeCode` will be visible for identification.

## Frontend Integration Examples

### Fetch Patient Appointments with Status Filter

```typescript
async function getPatientAppointments(token: string, status?: 'BOOKED' | 'COMPLETED' | 'NO_SHOW') {
  const params = new URLSearchParams()
  if (status) params.append('status', status)
  params.append('page', '1')
  params.append('limit', '10')

  const response = await fetch(`/api/appointments/patient?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch appointments')
  }

  const data = await response.json()
  return data.data // { appointments: [], pagination: {} }
}

// Usage
const bookedAppointments = await getPatientAppointments(token, 'BOOKED')
const completedAppointments = await getPatientAppointments(token, 'COMPLETED')
const missedAppointments = await getPatientAppointments(token, 'NO_SHOW')
```

### Fetch Doctor Appointments

```typescript
async function getDoctorAppointments(token: string, status?: 'BOOKED' | 'COMPLETED' | 'NO_SHOW') {
  const params = new URLSearchParams()
  if (status) params.append('status', status)
  params.append('page', '1')
  params.append('limit', '20')

  const response = await fetch(`/api/appointments/doctor?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch appointments')
  }

  const data = await response.json()
  return data.data
}
```

### Get Single Appointment with Full Details

```typescript
async function getAppointmentById(token: string, appointmentId: string) {
  const response = await fetch(`/api/appointment/${appointmentId}/full`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch appointment')
  }

  const data = await response.json()
  return data.data
}

// Usage
const appointment = await getAppointmentById(token, 'appointment_id_123')

// Access doctor details
console.log(appointment.doctor.doctor.professional_email)
console.log(appointment.doctor.doctor.education)
console.log(appointment.doctor.doctor.documents)

// Access patient details
console.log(appointment.patient.userInfo)
```

## Pagination

All list endpoints support pagination:

```typescript
{
  pagination: {
    page: number        // Current page number (1-indexed)
    limit: number       // Items per page
    total: number       // Total number of appointments
    totalPages: number  // Total number of pages
  }
}
```

**Example**: If you have 25 appointments with `limit: 10`:
- `page: 1` returns items 1-10
- `page: 2` returns items 11-20
- `page: 3` returns items 21-25

## Signed URLs

All S3 documents and images are automatically converted to signed URLs with a 7-day expiration:

- Doctor profile images
- Patient profile images
- Doctor documents (resume, medical license, introduction video)
- Education documents

Signed URLs are valid for 7 days from the time of the API request.

## Anonymous Mode Handling

When a patient has `isAnonymous = true`:

- **For the patient viewing their own appointments**: Full data is always visible
- **For doctors viewing patient appointments**: Name, email, and image are `null`, only `employeeCode` is visible
- **For admins**: Same as doctors (anonymized view)

The `userInfo` object is still included, but sensitive fields within it may be masked based on privacy settings.

## Error Handling

Common errors and solutions:

- **401 Unauthorized**: Provide a valid authentication token
- **403 Forbidden**: Ensure you're using the correct endpoint for your role (patient/doctor)
- **404 Not Found**: Verify the appointment ID is correct and you have access to it
- **400 Bad Request**: Check query parameters are valid (status must be BOOKED, COMPLETED, or NO_SHOW)

## Performance Considerations

- Use pagination for large result sets
- Filter by status when possible to reduce data transfer
- Signed URLs are cached for 7 days on the backend
- Full object queries include all related data, so they may take slightly longer than basic queries

## Notes

- Appointments are ordered by `createdAt` in descending order (newest first)
- The `getAll` endpoint (`GET /api/appointments`) still exists and returns basic user information without full objects
- Full detail endpoints are more resource-intensive but provide comprehensive data in a single request
- Patient anonymity is automatically handled - no additional parameters needed


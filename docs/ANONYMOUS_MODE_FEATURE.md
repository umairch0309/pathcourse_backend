# Anonymous Mode Feature for Patients

This document describes the anonymous mode feature that allows patients to hide their personal information (name, email, image) while only showing their employee ID on the platform.

## Overview

The anonymous mode feature provides privacy protection for patients who want to keep their identity hidden when interacting with doctors and the platform. When enabled, only the employee ID is shown instead of personal information.

## Key Features

1. **Patient-Only Feature**: Only patients can use anonymous mode (doctors cannot be anonymous)
2. **Information Masking**: When anonymous mode is enabled:
   - **Name**: Hidden (shows as `null`)
   - **Email**: Hidden (shows as `null`)
   - **Image**: Hidden (shows as `null`)
   - **Employee Code**: Visible (only identifier shown)
3. **Own Data Access**: Patients always see their own full information, even when anonymous mode is enabled
4. **Appointment Context**: Patient information is anonymized in appointment responses for doctors, but patients see their own data

## Database Schema

### User Model Addition

Added `isAnonymous` field to the `User` model:

```prisma
model User {
  // ... existing fields ...
  isAnonymous  Boolean?  @default(false)
  // ... rest of fields ...
}
```

## API Endpoints

### 1. Toggle Anonymous Mode

**Endpoint**: `POST /api/user/anonymous`

**Authentication**: Required (Patient only)

**Description**: Enable or disable anonymous mode for the authenticated patient.

**Request Body**: None (uses authenticated user's ID from session)

**Response**:
```json
{
  "message": "Anonymous mode enabled. Your name and email will be hidden.",
  "success": true,
  "data": {
    "id": "user_id",
    "name": "Patient Name",
    "email": "patient@example.com",
    "role": "patient",
    "isAnonymous": true,
    "employeeCode": "EMP12345"
  }
}
```

**Error Responses**:
- `401 Unauthorized`: User not authenticated
- `403 Forbidden`: Only patients can use anonymous mode
- `404 Not Found`: User not found

**Behavior**:
- Toggles `isAnonymous` between `true` and `false`
- Only works for users with `role = 'patient'`
- Returns the updated user data

## Implementation Details

### Helper Functions

The anonymization logic is implemented in `src/lib/anonymize-user.ts`:

#### `formatUserForAppointment()`
- Formats user data for appointment responses
- Anonymizes patient data if `isAnonymous = true` (unless viewing own data)
- Always shows doctor data (doctors cannot be anonymous)

#### `formatUserForResponse()`
- General-purpose user formatting with anonymization
- Patients see their own full data even when anonymous
- Other users see anonymized patient data when `isAnonymous = true`

### Where Anonymization is Applied

1. **Appointment Responses**:
   - When a doctor views an appointment, patient data is anonymized if the patient has `isAnonymous = true`
   - When a patient views their own appointment, they see full data regardless of anonymous mode
   - Doctor data is never anonymized in appointment context

2. **User Info Endpoints**:
   - User info responses respect anonymous mode when viewing other users
   - Users always see their own full information

3. **Query/List Endpoints**:
   - Patient data is anonymized in lists when `isAnonymous = true`
   - Only affects how other users see the patient's data

## Usage Examples

### Frontend: Toggle Anonymous Mode

```typescript
async function toggleAnonymousMode(token: string) {
  const response = await fetch('/api/user/anonymous', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to toggle anonymous mode')
  }

  const data = await response.json()
  return data.data // { id, name, email, role, isAnonymous, employeeCode }
}
```

### Frontend: Check if User is Anonymous

```typescript
// After fetching user info
const userInfo = await getUserInfo(token)
if (userInfo.data.user.isAnonymous === true) {
  // Show anonymous mode indicator
  // Hide name/email in UI
  // Only show employee code
}
```

### Frontend: Display Anonymous Patient Info

```typescript
function displayPatientInfo(patient: any) {
  if (patient.isAnonymous === true) {
    // Only show employee code
    return `Employee ID: ${patient.employeeCode}`
  } else {
    // Show full info
    return `${patient.name} (${patient.email})`
  }
}
```

## Privacy Protection Rules

1. **Patient Own Data**: Patients always see their own full information, even when anonymous mode is enabled
2. **Doctor Visibility**: Doctors see anonymized patient data when patient has `isAnonymous = true`
3. **Other Users**: All other users (except the patient themselves) see anonymized data when `isAnonymous = true`
4. **Employee Code Always Visible**: Employee code is always visible for identification purposes

## Service Layer

### User Service - `toggleAnonymousMode()`

```typescript
USER_SERVICES.toggleAnonymousMode(userId: string)
```

- Validates user exists
- Validates user is a patient (only patients can be anonymous)
- Toggles `isAnonymous` field
- Returns updated user data

### Appointment Service - Updated Queries

Appointment service queries now include `isAnonymous` and `employeeCode` in user selections:

```typescript
doctor: {
  select: {
    id: true,
    name: true,
    email: true,
    image: true,
    role: true,
    isAnonymous: true,  // Added
    employeeCode: true, // Added
  },
}
patient: {
  select: {
    id: true,
    name: true,
    email: true,
    image: true,
    role: true,
    isAnonymous: true,  // Added
    employeeCode: true, // Added
  },
}
```

## Migration

After updating the Prisma schema, run:

```bash
npx prisma migrate dev --name add_is_anonymous_field
npx prisma generate
```

## Notes

- **Default Value**: `isAnonymous` defaults to `false` for all users
- **Role Restriction**: Only patients can enable anonymous mode
- **Backwards Compatibility**: Existing patients are not anonymous by default
- **Employee Code Required**: For anonymous mode to be useful, patients should have an `employeeCode` assigned
- **Own Data Always Visible**: This feature protects patient privacy from others, not from themselves

## Security Considerations

1. **Role Validation**: Anonymous mode toggle is restricted to patients only
2. **Own Data Access**: Users always have access to their own full data regardless of anonymous mode
3. **Database Integrity**: The `isAnonymous` field is stored in the database and applied consistently across all endpoints
4. **No Bypass**: There's no way to bypass anonymization when viewing other users' data if they have anonymous mode enabled


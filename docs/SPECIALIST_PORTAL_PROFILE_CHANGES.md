# Specialist Portal Profile Changes

This document outlines the changes made to the Specialist Portal Profile structure, including schema updates and API modifications.

## Overview

The Specialist Portal Profile has been updated to streamline the doctor profile information structure. The changes affect the database schema, API routes, handlers, and services.

## Schema Changes

### Doctor Model

**Removed Fields:**
- `about` - Removed the "About" field from the doctor profile

**Added Fields:**
- `secondary_contact` (String, optional) - Added for secondary contact information

**Updated Structure:**
```prisma
model Doctor {
  id                     String                  @id @default(cuid())
  userid                 String                  @unique
  createdAt              DateTime                @default(now())
  updatedAt              DateTime                @updatedAt
  professional_contact   String
  professional_email     String                  @unique
  secondary_contact      String?                // NEW
  isAvailable            Boolean                 @default(false)
  isInMeeting            Boolean                 @default(false)
  availableDurations     Int[]                   @default([15, 30, 45, 60])
  // ... about field removed
}
```

### Education Model

**Removed Fields:**
- `institute_address` - Removed the institute address field

**Updated Structure:**
```prisma
model Education {
  id               String    @id @default(cuid())
  doctorId         String
  degree           String    @db.VarChar(100)
  startYear        DateTime
  document         String?   @db.VarChar(500)
  endYear          DateTime?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  institution_name String    @db.VarChar(200)
  // ... institute_address field removed
}
```

### ProfessionalExperience Model

**Removed Fields:**
- `funding_opions` - Removed funding options field
- `language` - Removed single language field

**Updated Fields:**
- `languages` (String[]) - Changed from single `language` (String) to array of languages

**Updated Structure:**
```prisma
model ProfessionalExperience {
  id                    String    @id @default(cuid())
  doctorId              String    @unique
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  age_group             String    @db.VarChar(100)
  languages             String[]  @default([])  // Changed from language: String
  profession            String
  special_interest_area String
  // ... funding_opions field removed
}
```

### Documents Model

**Removed Fields:**
- `W9_form` - Removed W9 form upload
- `attachments` (String[]) - Removed attachments array
- `affiliations` (String[]) - Removed affiliations array

**Added Fields:**
- `resume` (String, optional) - Resume upload field
- `medicalLicense` (String, optional) - Medical license upload field
- `introductionVideo` (String, optional) - 20-30 second introduction video upload

**Updated Structure:**
```prisma
model Documents {
  id                String   @id @default(cuid())
  doctorId          String   @unique
  resume            String?  @db.VarChar(500)           // NEW
  medicalLicense    String?  @db.VarChar(500)         // NEW
  introductionVideo String?  @db.VarChar(500)          // NEW
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  // ... W9_form, attachments, affiliations removed
}
```

## API Changes

### Doctor API (`/api/doctor`)

#### POST `/api/doctor` - Create or Update Doctor Information

**Request Body Changes:**
- ❌ Removed: `about` (required string)
- ✅ Kept: `professional_contact`, `professional_email`, `image`, and optional user info fields

**Before:**
```json
{
  "professional_contact": "+1234567890",
  "professional_email": "doctor@example.com",
  "about": "Experienced cardiologist with 10 years of practice",  // REMOVED
  "image": "https://example.com/profile.jpg",
  "gender": "male",
  "dateOfBirth": "1980-01-15T00:00:00.000Z",
  "phone": "+1234567890",
  "address": "123 Medical Center, City, State"
}
```

**After:**
```json
{
  "professional_contact": "+1234567890",
  "professional_email": "doctor@example.com",
  "image": "https://example.com/profile.jpg",
  "gender": "male",
  "dateOfBirth": "1980-01-15T00:00:00.000Z",
  "phone": "+1234567890",
  "address": "123 Medical Center, City, State"
}
```

**Response Changes:**
- ❌ Removed: `about` field from response

**Before:**
```json
{
  "id": "doctor_id",
  "userid": "user_id",
  "professional_contact": "+1234567890",
  "professional_email": "doctor@example.com",
  "about": "Experienced cardiologist...",  // REMOVED
  "isAvailable": false,
  "isInMeeting": false,
  "availableDurations": [15, 30, 45, 60],
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z",
  "user": { ... }
}
```

**After:**
```json
{
  "id": "doctor_id",
  "userid": "user_id",
  "professional_contact": "+1234567890",
  "professional_email": "doctor@example.com",
  "isAvailable": false,
  "isInMeeting": false,
  "availableDurations": [15, 30, 45, 60],
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z",
  "user": { ... }
}
```

#### GET `/api/doctor` - Get Current Doctor Information
- Response no longer includes `about` field

#### GET `/api/doctor/{id}` - Get Doctor by ID
- Response no longer includes `about` field

### Education API (`/api/education`)

#### POST `/api/education` - Bulk Create Education Records

**Request Body Changes:**
- ❌ Removed: `institute_address` (required string)

**Before:**
```json
{
  "educations": [
    {
      "degree": "MD",
      "startYear": "2010-09-01T00:00:00.000Z",
      "endYear": "2014-06-30T00:00:00.000Z",
      "document": "https://example.com/certificate.pdf",
      "institute_address": "123 Medical School St, City, State",  // REMOVED
      "institution_name": "Medical University"
    }
  ]
}
```

**After:**
```json
{
  "educations": [
    {
      "degree": "MD",
      "startYear": "2010-09-01T00:00:00.000Z",
      "endYear": "2014-06-30T00:00:00.000Z",
      "document": "https://example.com/certificate.pdf",
      "institution_name": "Medical University"
    }
  ]
}
```

**Response Changes:**
- ❌ Removed: `institute_address` field from response

**Before:**
```json
{
  "id": "education_id",
  "doctorId": "doctor_id",
  "degree": "MD",
  "startYear": "2010-09-01T00:00:00.000Z",
  "endYear": "2014-06-30T00:00:00.000Z",
  "document": "https://example.com/certificate.pdf",
  "institute_address": "123 Medical School St...",  // REMOVED
  "institution_name": "Medical University",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

**After:**
```json
{
  "id": "education_id",
  "doctorId": "doctor_id",
  "degree": "MD",
  "startYear": "2010-09-01T00:00:00.000Z",
  "endYear": "2014-06-30T00:00:00.000Z",
  "document": "https://example.com/certificate.pdf",
  "institution_name": "Medical University",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

#### PUT `/api/education/{id}` - Update Education Record
- Request body no longer accepts `institute_address`
- Response no longer includes `institute_address`

#### GET `/api/education` - Get All Education Records
- Response no longer includes `institute_address` in education items

#### GET `/api/education/{id}` - Get Education by ID
- Response no longer includes `institute_address`

## Files Modified

### Schema Files
- `prisma/schema.prisma` - Updated Doctor, Education, ProfessionalExperience, and Documents models

### API Route Files
- `src/routes/doctor/doctor.routes.ts` - Removed `about` from request/response schemas
- `src/routes/education/education.routes.ts` - Removed `institute_address` from request/response schemas

### API Handler Files
- `src/routes/doctor/doctor.handlers.ts` - Removed `about` from request processing and response formatting
- `src/routes/education/education.handlers.ts` - Removed `institute_address` from request processing and response formatting

### Service Files
- `src/services/doctor.service.ts` - Removed `about` from service function signatures and database operations
- `src/services/education.service.ts` - Removed `institute_address` from service function signatures and database operations

## Migration Notes

### Database Migration Required

After applying these schema changes, you need to run a Prisma migration:

```bash
npx prisma migrate dev --name update-specialist-portal-profile
```

This will:
1. Remove the `about` column from the `Doctor` table
2. Add the `secondary_contact` column to the `Doctor` table
3. Remove the `institute_address` column from the `Education` table
4. Remove the `funding_opions` column from the `ProfessionalExperience` table
5. Remove the `language` column from the `ProfessionalExperience` table
6. Add the `languages` column (String[]) to the `ProfessionalExperience` table
7. Remove `W9_form`, `attachments`, and `affiliations` columns from the `Documents` table
8. Add `resume`, `medicalLicense`, and `introductionVideo` columns to the `Documents` table

### Data Migration Considerations

⚠️ **Important:** Before running the migration, consider:

1. **Existing `about` data**: If you have existing doctor profiles with `about` information, you may want to:
   - Export the data before migration
   - Store it elsewhere if needed for reference
   - Or migrate it to another field if required

2. **Existing `institute_address` data**: Similar consideration for education records

3. **Language field conversion**: The `language` field (String) is being replaced with `languages` (String[]). You may need to:
   - Convert existing single language values to arrays
   - Handle cases where multiple languages were stored in the single field

4. **Documents migration**: Existing `W9_form`, `attachments`, and `affiliations` data will be lost. Consider:
   - Exporting existing document URLs
   - Migrating important documents to the new `resume` or `medicalLicense` fields if applicable

## Future API Development

### Professional Experience API (Not Yet Implemented)

When implementing the Professional Experience API, use the following structure:

**Expected Request Body:**
```json
{
  "age_group": "Adults",
  "languages": ["English", "Spanish"],  // Array of strings
  "profession": "Cardiologist",
  "special_interest_area": "Heart Disease"
}
```

**Expected Response:**
```json
{
  "id": "exp_id",
  "doctorId": "doctor_id",
  "age_group": "Adults",
  "languages": ["English", "Spanish"],
  "profession": "Cardiologist",
  "special_interest_area": "Heart Disease",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

### Documents API (Not Yet Implemented)

When implementing the Documents API, use the following structure:

**Expected Request Body:**
```json
{
  "resume": "https://example.com/resume.pdf",
  "medicalLicense": "https://example.com/license.pdf",
  "introductionVideo": "https://example.com/video.mp4"
}
```

**Expected Response:**
```json
{
  "id": "doc_id",
  "doctorId": "doctor_id",
  "resume": "https://example.com/resume.pdf",
  "medicalLicense": "https://example.com/license.pdf",
  "introductionVideo": "https://example.com/video.mp4",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

## Breaking Changes

### API Breaking Changes

1. **Doctor API**
   - ❌ `POST /api/doctor` - `about` field is no longer accepted in request body
   - ❌ All doctor endpoints - `about` field is no longer returned in responses

2. **Education API**
   - ❌ `POST /api/education` - `institute_address` field is no longer accepted in request body
   - ❌ `PUT /api/education/{id}` - `institute_address` field is no longer accepted in request body
   - ❌ All education endpoints - `institute_address` field is no longer returned in responses

### Client-Side Updates Required

Frontend applications using these APIs need to:

1. Remove `about` field from doctor profile forms and displays
2. Remove `institute_address` field from education forms and displays
3. Update any validation logic that references these fields
4. Update TypeScript types/interfaces to reflect the new structure

## Testing Checklist

After applying these changes, verify:

- [ ] Doctor creation/update works without `about` field
- [ ] Doctor responses don't include `about` field
- [ ] Education creation works without `institute_address` field
- [ ] Education update works without `institute_address` field
- [ ] Education responses don't include `institute_address` field
- [ ] Database migration runs successfully
- [ ] No TypeScript compilation errors
- [ ] API validation works correctly with new schemas
- [ ] Existing data is handled appropriately during migration

## Summary

This update streamlines the Specialist Portal Profile by:

1. **Contact Info**: Removed "About" section, kept only "Professional Contact Details"
2. **Education**: Removed "Institute Address" field
3. **Professional Experience**: Changed single `language` to `languages` array, removed `funding_opions`
4. **Documents**: Simplified to only `resume`, `medicalLicense`, and `introductionVideo`

All changes maintain backward compatibility at the API level (removing fields) while requiring frontend updates to match the new structure.


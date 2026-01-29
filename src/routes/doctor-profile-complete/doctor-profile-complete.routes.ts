import { createRoute, z } from '@hono/zod-openapi'
import * as HttpStatusCodes from 'stoker/http-status-codes'
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers'
import { createErrorSchema } from 'stoker/openapi/schemas'
import TAGS from '~/config/tags'
import { zodResponseSchema } from '~/lib/zod-helper'
import { isAuthenticated } from '~/middleware/is-authenticated'

// Update Profile Schema
const updateProfileBodySchema = z
  .object({
    professional_contact: z.string().min(1).optional().describe('Professional contact number'),
    professional_email: z.string().email().optional().describe('Professional email address'),
    secondary_contact: z.string().nullable().optional().describe('Secondary contact number'),
    image: z.string().max(500).nullable().optional().describe('Profile image URL'),
    gender: z.string().max(20).nullable().optional().describe('Gender'),
    dateOfBirth: z
      .string()
      .datetime()
      .nullable()
      .optional()
      .describe('Date of birth in UTC (ISO 8601 format)'),
    phone: z.string().max(50).nullable().optional().describe('Phone number'),
    address: z.string().max(500).nullable().optional().describe('Address'),
  })
  .describe('Request body for updating doctor profile')

// Update Professional Experience Schema
const updateProfessionalExperienceBodySchema = z
  .object({
    age_group: z.string().min(1).max(100).optional().describe('Age group the doctor serves'),
    languages: z
      .array(z.string())
      .min(1)
      .optional()
      .describe('Array of languages the doctor speaks'),
    profession: z.string().min(1).optional().describe('Doctor profession/specialty'),
    special_interest_area: z.string().min(1).optional().describe('Special interest area'),
  })
  .describe('Request body for updating professional experience')

// Update Documents Schema
const updateDocumentsBodySchema = z
  .object({
    resume: z.string().max(500).nullable().optional().describe('Resume document URL'),
    medicalLicense: z
      .string()
      .max(500)
      .nullable()
      .optional()
      .describe('Medical license document URL'),
    introductionVideo: z.string().max(500).nullable().optional().describe('Introduction video URL'),
  })
  .describe('Request body for updating documents')

// Add Education Schema
const addEducationBodySchema = z
  .object({
    degree: z.string().min(1).max(100).describe('Degree or qualification name'),
    startYear: z.string().datetime().describe('Start year in UTC (ISO 8601 format)'),
    endYear: z
      .string()
      .datetime()
      .nullable()
      .optional()
      .describe('End year in UTC (ISO 8601 format)'),
    document: z
      .string()
      .max(500)
      .nullable()
      .optional()
      .describe('Document URL (e.g., certificate)'),
    institution_name: z.string().min(1).max(200).describe('Institution name'),
  })
  .describe('Request body for adding education record')

// Response Schemas
const doctorBasicInfoSchema = z
  .object({
    id: z.string(),
    userid: z.string(),
    professional_contact: z.string(),
    professional_email: z.string(),
    secondary_contact: z.string().nullable(),
    isAvailable: z.boolean(),
    isInMeeting: z.boolean(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    user: z.object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
      image: z.string().nullable(),
      role: z.string().nullable(),
      isAnonymous: z.boolean().nullable(),
      employeeCode: z.string().nullable(),
      userInfo: z
        .object({
          id: z.string(),
          userId: z.string(),
          gender: z.string().nullable(),
          dateOfBirth: z.string().datetime().nullable(),
          phone: z.string().nullable(),
          address: z.string().nullable(),
          createdAt: z.string().datetime(),
          updatedAt: z.string().datetime(),
        })
        .nullable()
        .optional(),
    }),
  })
  .describe('Doctor basic information')

const educationResponseSchema = z
  .object({
    id: z.string(),
    doctorId: z.string(),
    degree: z.string(),
    startYear: z.string().datetime(),
    endYear: z.string().datetime().nullable(),
    document: z.string().nullable(),
    institution_name: z.string(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .describe('Education information')

const professionalExperienceResponseSchema = z
  .object({
    id: z.string(),
    doctorId: z.string(),
    age_group: z.string(),
    languages: z.array(z.string()),
    profession: z.string(),
    special_interest_area: z.string(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .nullable()
  .describe('Professional experience information')

const documentsResponseSchema = z
  .object({
    id: z.string(),
    doctorId: z.string(),
    resume: z.string().nullable(),
    medicalLicense: z.string().nullable(),
    introductionVideo: z.string().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .nullable()
  .describe('Documents information')

const completeDoctorProfileResponseSchema = z
  .object({
    doctor: doctorBasicInfoSchema,
    education: z.array(educationResponseSchema),
    professionalExperience: professionalExperienceResponseSchema,
    documents: documentsResponseSchema,
  })
  .describe('Complete doctor profile with all details')

export const DOCTOR_PROFILE_COMPLETE_ROUTES = {
  getComplete: createRoute({
    path: '/doctor/profile/complete',
    method: 'get',
    tags: [TAGS.doctorProfile],
    middleware: [isAuthenticated],
    summary: 'Get complete doctor profile with all details (Doctor only)',
    request: {},
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(completeDoctorProfileResponseSchema),
        'Complete doctor profile retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        zodResponseSchema(),
        'Forbidden - Only doctors can access this endpoint'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(zodResponseSchema(), 'Doctor not found'),
    },
  }),

  updateProfile: createRoute({
    path: '/doctor/profile',
    method: 'put',
    tags: [TAGS.doctorProfile],
    middleware: [isAuthenticated],
    summary: 'Update doctor basic profile information (Doctor only)',
    request: {
      body: jsonContentRequired(
        updateProfileBodySchema,
        'Request body for updating doctor profile'
      ),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(doctorBasicInfoSchema),
        'Doctor profile updated successfully'
      ),
      [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
        createErrorSchema(updateProfileBodySchema),
        'Unprocessable Entity'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        zodResponseSchema(),
        'Forbidden - Only doctors can access this endpoint'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(zodResponseSchema(), 'Doctor not found'),
      [HttpStatusCodes.BAD_REQUEST]: jsonContent(zodResponseSchema(), 'Bad Request'),
    },
  }),

  updateProfessionalExperience: createRoute({
    path: '/doctor/profile/professional-experience',
    method: 'put',
    tags: [TAGS.doctorProfile],
    middleware: [isAuthenticated],
    summary: 'Update doctor professional experience (Doctor only)',
    request: {
      body: jsonContentRequired(
        updateProfessionalExperienceBodySchema,
        'Request body for updating professional experience'
      ),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(professionalExperienceResponseSchema),
        'Professional experience updated successfully'
      ),
      [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
        createErrorSchema(updateProfessionalExperienceBodySchema),
        'Unprocessable Entity'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        zodResponseSchema(),
        'Forbidden - Only doctors can access this endpoint'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(zodResponseSchema(), 'Doctor not found'),
      [HttpStatusCodes.BAD_REQUEST]: jsonContent(zodResponseSchema(), 'Bad Request'),
    },
  }),

  updateDocuments: createRoute({
    path: '/doctor/profile/documents',
    method: 'put',
    tags: [TAGS.doctorProfile],
    middleware: [isAuthenticated],
    summary: 'Update doctor documents (Doctor only)',
    request: {
      body: jsonContentRequired(updateDocumentsBodySchema, 'Request body for updating documents'),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(documentsResponseSchema),
        'Documents updated successfully'
      ),
      [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
        createErrorSchema(updateDocumentsBodySchema),
        'Unprocessable Entity'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        zodResponseSchema(),
        'Forbidden - Only doctors can access this endpoint'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(zodResponseSchema(), 'Doctor not found'),
      [HttpStatusCodes.BAD_REQUEST]: jsonContent(zodResponseSchema(), 'Bad Request'),
    },
  }),

  addEducation: createRoute({
    path: '/doctor/profile/education',
    method: 'post',
    tags: [TAGS.doctorProfile],
    middleware: [isAuthenticated],
    summary: 'Add a new education record (Doctor only)',
    request: {
      body: jsonContentRequired(addEducationBodySchema, 'Request body for adding education record'),
    },
    responses: {
      [HttpStatusCodes.CREATED]: jsonContent(
        zodResponseSchema(educationResponseSchema),
        'Education record added successfully'
      ),
      [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
        createErrorSchema(addEducationBodySchema),
        'Unprocessable Entity'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        zodResponseSchema(),
        'Forbidden - Only doctors can access this endpoint'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(zodResponseSchema(), 'Doctor not found'),
      [HttpStatusCodes.BAD_REQUEST]: jsonContent(zodResponseSchema(), 'Bad Request'),
    },
  }),

  deleteEducation: createRoute({
    path: '/doctor/profile/education/{id}',
    method: 'delete',
    tags: [TAGS.doctorProfile],
    middleware: [isAuthenticated],
    summary: 'Delete an education record (Doctor only)',
    request: {
      params: z.object({
        id: z.string().describe('Education record ID'),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(),
        'Education record deleted successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        zodResponseSchema(),
        'Forbidden - Only doctors can access this endpoint'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(zodResponseSchema(), 'Education record not found'),
    },
  }),
}

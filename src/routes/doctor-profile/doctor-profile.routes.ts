import { createRoute, z } from '@hono/zod-openapi'
import * as HttpStatusCodes from 'stoker/http-status-codes'
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers'
import { createErrorSchema } from 'stoker/openapi/schemas'
import TAGS from '~/config/tags'
import { zodResponseSchema } from '~/lib/zod-helper'
import { isAuthenticated } from '~/middleware/is-authenticated'

const professionalExperienceSchema = z
  .object({
    age_group: z.string().min(1).max(100).describe('Age group the doctor serves'),
    languages: z.array(z.string()).min(1).describe('Array of languages the doctor speaks'),
    profession: z.string().min(1).describe('Doctor profession/specialty'),
    special_interest_area: z.string().min(1).describe('Special interest area'),
  })
  .describe('Professional experience information')

const documentsSchema = z
  .object({
    resume: z.string().max(500).nullable().optional().describe('Resume document URL'),
    medicalLicense: z
      .string()
      .max(500)
      .nullable()
      .optional()
      .describe('Medical license document URL (if applicable)'),
    introductionVideo: z
      .string()
      .max(500)
      .nullable()
      .optional()
      .describe('20-30 second introduction video URL for users'),
  })
  .describe('Documents information')

const createOrUpdateDoctorProfileBodySchema = z
  .object({
    professionalExperience: professionalExperienceSchema,
    documents: documentsSchema,
  })
  .describe(
    'Request body for creating or updating doctor profile (professional experience and documents)'
  )

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
  .describe('Documents information')

const doctorProfileResponseSchema = z
  .object({
    professionalExperience: professionalExperienceResponseSchema,
    documents: documentsResponseSchema,
  })
  .describe('Doctor profile with professional experience and documents')

export const DOCTOR_PROFILE_ROUTES = {
  createOrUpdate: createRoute({
    path: '/doctor-profile',
    method: 'post',
    tags: [TAGS.doctorProfile],
    middleware: [isAuthenticated],
    summary: 'Create or update doctor profile (Professional Experience and Documents)',
    request: {
      body: jsonContentRequired(
        createOrUpdateDoctorProfileBodySchema,
        'Request body for creating or updating doctor profile'
      ),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(doctorProfileResponseSchema),
        'Doctor profile created or updated successfully'
      ),
      [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
        createErrorSchema(createOrUpdateDoctorProfileBodySchema),
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

  getCurrent: createRoute({
    path: '/doctor-profile',
    method: 'get',
    tags: [TAGS.doctorProfile],
    middleware: [isAuthenticated],
    summary: 'Get current doctor profile (Professional Experience and Documents)',
    request: {},
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(doctorProfileResponseSchema),
        'Doctor profile retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        zodResponseSchema(),
        'Forbidden - Only doctors can access this endpoint'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(zodResponseSchema(), 'Doctor profile not found'),
    },
  }),
}

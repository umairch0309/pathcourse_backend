import { createRoute, z } from '@hono/zod-openapi'
import * as HttpStatusCodes from 'stoker/http-status-codes'
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers'
import { createErrorSchema } from 'stoker/openapi/schemas'
import TAGS from '~/config/tags'
import { zodResponseSchema } from '~/lib/zod-helper'
import { isAuthenticated } from '~/middleware/is-authenticated'

const createOrUpdateDoctorBodySchema = z
  .object({
    professional_contact: z.string().min(1).describe('Professional contact number'),
    professional_email: z.string().email().describe('Professional email address'),
    image: z.string().nullable().optional().describe('Profile image'),
    // Optional user info fields
    gender: z.string().max(20).nullable().optional().describe('User gender'),
    dateOfBirth: z
      .string()
      .datetime()
      .nullable()
      .optional()
      .describe('User date of birth in UTC (ISO 8601 format)'),
    phone: z.string().max(50).nullable().optional().describe('User phone number'),
    address: z.string().nullable().optional().describe('User address'),
  })
  .describe('Request body for creating or updating doctor information')

const doctorResponseSchema = z
  .object({
    id: z.string(),
    userid: z.string(),
    professional_contact: z.string(),
    professional_email: z.string(),
    isAvailable: z.boolean(),
    isInMeeting: z.boolean(),
    availableDurations: z.array(z.number().int()),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    user: z.object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
      image: z.string().nullable(),
      role: z.string().nullable(),
    }),
  })
  .describe('Doctor information with related user data')

export const DOCTOR_ROUTES = {
  createOrUpdate: createRoute({
    path: '/doctor',
    method: 'post',
    tags: [TAGS.doctor],
    middleware: [isAuthenticated],
    summary: 'Create or update doctor information',
    request: {
      body: jsonContentRequired(
        createOrUpdateDoctorBodySchema,
        'Request body for doctor information'
      ),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(doctorResponseSchema),
        'Doctor information created or updated successfully'
      ),
      [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
        createErrorSchema(createOrUpdateDoctorBodySchema),
        'Unprocessable Entity'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        zodResponseSchema(),
        'Forbidden - Only doctors can access this endpoint'
      ),
      [HttpStatusCodes.BAD_REQUEST]: jsonContent(zodResponseSchema(), 'Bad Request'),
    },
  }),

  getCurrent: createRoute({
    path: '/doctor',
    method: 'get',
    tags: [TAGS.doctor],
    middleware: [isAuthenticated],
    summary: 'Get current doctor information',
    request: {},
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(doctorResponseSchema),
        'Doctor information retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        zodResponseSchema(),
        'Forbidden - Only doctors can access this endpoint'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(zodResponseSchema(), 'Doctor information not found'),
    },
  }),

  getById: createRoute({
    path: '/doctor/{id}',
    method: 'get',
    tags: [TAGS.doctor],
    summary: 'Get doctor information by ID (Public)',
    request: {
      params: z.object({
        id: z.string().describe('Doctor ID'),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(doctorResponseSchema),
        'Doctor information retrieved successfully'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(zodResponseSchema(), 'Doctor not found'),
    },
  }),
}

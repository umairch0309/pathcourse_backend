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

const doctorCompleteResponseSchema = z
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
      onboardingStage: z.string().nullable(),
    }),
    documents: z
      .object({
        id: z.string(),
        resume: z.string().nullable(),
        medicalLicense: z.string().nullable(),
        introductionVideo: z.string().nullable(),
      })
      .nullable(),
    education: z.array(
      z.object({
        id: z.string(),
        degree: z.string(),
        institution_name: z.string(),
        startYear: z.string().datetime(),
        endYear: z.string().datetime().nullable(),
        document: z.string().nullable(),
      })
    ),
    professionalExperience: z
      .object({
        id: z.string(),
        profession: z.string(),
        special_interest_area: z.string(),
        age_group: z.string(),
        languages: z.array(z.string()),
      })
      .nullable(),
  })
  .describe('Complete doctor information with all related data')

const doctorListResponseSchema = z
  .object({
    doctors: z.array(doctorCompleteResponseSchema),
    pagination: z.object({
      page: z.number().int(),
      limit: z.number().int(),
      total: z.number().int(),
      totalPages: z.number().int(),
    }),
  })
  .describe('List of doctors with pagination')

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
    summary: 'Get complete doctor information by ID (Public)',
    request: {
      params: z.object({
        id: z.string().describe('Doctor ID'),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(doctorCompleteResponseSchema),
        'Doctor information retrieved successfully'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(zodResponseSchema(), 'Doctor not found'),
    },
  }),

  toggleAvailability: createRoute({
    path: '/doctor/availability/toggle',
    method: 'post',
    tags: [TAGS.doctor],
    middleware: [isAuthenticated],
    summary: 'Toggle doctor availability status (Doctor only)',
    request: {},
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(doctorResponseSchema),
        'Availability toggled successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        zodResponseSchema(),
        'Forbidden - Only doctors can access this endpoint'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(zodResponseSchema(), 'Doctor not found'),
    },
  }),

  getAvailableDoctors: createRoute({
    path: '/doctors/available',
    method: 'get',
    tags: [TAGS.doctor],
    summary: 'Get all available doctors (Public)',
    request: {
      query: z.object({
        page: z.string().optional().describe('Page number (default: 1)'),
        limit: z.string().optional().describe('Items per page (default: 10)'),
        search: z.string().optional().describe('Search by name or professional email'),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(doctorListResponseSchema),
        'Available doctors retrieved successfully'
      ),
    },
  }),

  updateMeetingStatus: createRoute({
    path: '/doctor/meeting/status',
    method: 'post',
    tags: [TAGS.doctor],
    middleware: [isAuthenticated],
    summary: 'Update doctor meeting status (Doctor only)',
    request: {
      body: jsonContentRequired(
        z.object({
          isInMeeting: z.boolean().describe('Whether the doctor is currently in a meeting'),
        }),
        'Request body for updating meeting status'
      ),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(doctorResponseSchema),
        'Meeting status updated successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        zodResponseSchema(),
        'Forbidden - Only doctors can access this endpoint'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(zodResponseSchema(), 'Doctor not found'),
    },
  }),

  heartbeat: createRoute({
    path: '/doctor/connection/heartbeat',
    method: 'post',
    tags: [TAGS.doctor],
    middleware: [isAuthenticated],
    summary: 'Send heartbeat to maintain connection (Doctor only)',
    request: {},
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(
          z.object({
            timestamp: z.string().datetime(),
            message: z.string(),
          })
        ),
        'Heartbeat received successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        zodResponseSchema(),
        'Forbidden - Only doctors can access this endpoint'
      ),
    },
  }),

  disconnect: createRoute({
    path: '/doctor/connection/disconnect',
    method: 'post',
    tags: [TAGS.doctor],
    middleware: [isAuthenticated],
    summary: 'Handle doctor disconnection (Doctor only)',
    request: {},
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(
          z.object({
            isAvailable: z.boolean(),
            isInMeeting: z.boolean(),
            message: z.string(),
          })
        ),
        'Disconnection handled successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        zodResponseSchema(),
        'Forbidden - Only doctors can access this endpoint'
      ),
    },
  }),
}

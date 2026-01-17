import { createRoute, z } from '@hono/zod-openapi'
import * as HttpStatusCodes from 'stoker/http-status-codes'
import { jsonContent } from 'stoker/openapi/helpers'
import { createErrorSchema } from 'stoker/openapi/schemas'
import TAGS from '~/config/tags'
import { zodResponseSchema } from '~/lib/zod-helper'

// Request parameter schemas
const appointmentIdParamsSchema = z.object({
  appointmentId: z.string().min(1).describe('Appointment ID'),
})

// Response schemas
const tokenResponseSchema = z
  .object({
    token: z.string().describe('Agora RTC token for joining the video call'),
    channel: z.string().describe('Channel name (same as appointment ID)'),
    uid: z.number().describe('Unique User ID for Agora (role-based)'),
    appId: z.string().describe('Agora App ID'),
    expiry: z.string().datetime().describe('Token expiry time in UTC (ISO 8601 format)'),
    isExisting: z.boolean().describe('Whether this is an existing token or newly generated'),
    message: z.string().describe('Success message'),
  })
  .describe('Agora token response')

const appointmentAccessSchema = z
  .object({
    isValid: z.boolean().describe('Whether the appointment exists and is valid'),
    canAccess: z.boolean().describe('Whether the user can currently access the appointment'),
    message: z.string().describe('Access status message'),
    appointment: z
      .object({
        startTime: z.string().datetime().describe('Appointment start time in UTC'),
        endTime: z.string().datetime().describe('Appointment end time in UTC'),
        earliestAccess: z
          .string()
          .datetime()
          .describe('Earliest access time (30 min before start)'),
        latestAccess: z.string().datetime().describe('Latest access time (30 min after end)'),
      })
      .optional()
      .describe('Appointment timing details'),
  })
  .describe('Appointment access validation response')

const tokenStatsSchema = z
  .object({
    id: z.string().describe('Token ID'),
    channel: z.string().describe('Channel name'),
    doctorToken: z.string().nullable().describe('Doctor Agora token'),
    patientToken: z.string().nullable().describe('Patient Agora token'),
    doctorUid: z.number().nullable().describe('Doctor UID'),
    patientUid: z.number().nullable().describe('Patient UID'),
    expiry: z.string().datetime().describe('Token expiry time'),
    patientJoined: z.string().datetime().nullable().describe('When patient joined'),
    doctorJoined: z.string().datetime().nullable().describe('When doctor joined'),
    patientEnded: z.string().datetime().nullable().describe('When patient left'),
    doctorEnded: z.string().datetime().nullable().describe('When doctor left'),
    joinedFirst: z.string().describe('Who joined first (doctor/patient)'),
    createdAt: z.string().datetime().describe('Token creation time'),
  })
  .nullable()
  .describe('Token usage statistics')

export const AGORA_ROUTES = {
  getToken: createRoute({
    path: '/agora/token/{appointmentId}',
    method: 'get',
    tags: [TAGS.agora],
    summary: 'Generate or retrieve Agora token for appointment',
    description:
      'Generate a new Agora RTC token or retrieve existing valid token for video call. Users can join 30 minutes before appointment start and up to 30 minutes after appointment end.',
    request: {
      params: appointmentIdParamsSchema,
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(tokenResponseSchema),
        'Token generated or retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        zodResponseSchema(),
        'User not authorized for this appointment'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(zodResponseSchema(), 'Appointment not found'),
      [HttpStatusCodes.BAD_REQUEST]: jsonContent(
        zodResponseSchema(),
        'Token access window not available'
      ),
      [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
        createErrorSchema(appointmentIdParamsSchema),
        'Invalid appointment ID'
      ),
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
        zodResponseSchema(),
        'Internal server error'
      ),
    },
  }),

  validateAccess: createRoute({
    path: '/agora/validate/{appointmentId}',
    method: 'get',
    tags: [TAGS.agora],
    summary: 'Validate appointment access window',
    description:
      'Check if the appointment exists and whether the current time is within the access window (30 minutes before to 30 minutes after appointment).',
    request: {
      params: appointmentIdParamsSchema,
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(appointmentAccessSchema),
        'Access validation completed'
      ),
      [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
        createErrorSchema(appointmentIdParamsSchema),
        'Invalid appointment ID'
      ),
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
        zodResponseSchema(),
        'Internal server error'
      ),
    },
  }),

  getTokenStats: createRoute({
    path: '/agora/stats/{appointmentId}',
    method: 'get',
    tags: [TAGS.agora],
    summary: 'Get token usage statistics',
    description:
      'Retrieve statistics about token usage for an appointment, including join/leave times for both doctor and patient.',
    request: {
      params: appointmentIdParamsSchema,
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(tokenStatsSchema),
        'Token statistics retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        zodResponseSchema(),
        'User not authorized for this appointment'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(
        zodResponseSchema(),
        'No token found for appointment'
      ),
      [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
        createErrorSchema(appointmentIdParamsSchema),
        'Invalid appointment ID'
      ),
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
        zodResponseSchema(),
        'Internal server error'
      ),
    },
  }),
}

import { createRoute, z } from '@hono/zod-openapi'
import * as HttpStatusCodes from 'stoker/http-status-codes'
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers'
import { createErrorSchema } from 'stoker/openapi/schemas'
import TAGS from '~/config/tags'
import { zodResponseSchema } from '~/lib/zod-helper'
import { isAuthenticated } from '~/middleware/is-authenticated'

const createAppointmentBodySchema = z
  .object({
    doctorId: z.string().describe('Doctor ID'),
    appointmentFor: z.enum(['self', 'someone else']).describe('Who the appointment is for'),
    issue: z.string().min(1).describe('Issue or reason for appointment'),
    age: z.number().int().positive().optional().describe('Age of the person (if booking for self)'),
    uploadId: z.string().optional().describe('Upload ID for any documents'),
    scheduledAt: z.string().datetime().optional().describe('Scheduled date and time in UTC (ISO 8601 format)'),
    relationWithPatient: z
      .string()
      .optional()
      .describe('Relation with patient (required if appointmentFor is "someone else")'),
    patientName: z.string().optional().describe('Patient name (required if appointmentFor is "someone else")'),
    patientAge: z.number().int().positive().optional().describe('Patient age (required if appointmentFor is "someone else")'),
  })
  .describe('Request body for creating an appointment')

const appointmentResponseSchema = z
  .object({
    id: z.string(),
    doctorId: z.string(),
    patientId: z.string(),
    status: z.enum(['BOOKED', 'COMPLETED', 'NO_SHOW']),
    scheduledAt: z.string().datetime().nullable(),
    startedAt: z.string().datetime().nullable(),
    endedAt: z.string().datetime().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    chatroomExpiry: z.string().datetime().nullable(),
    age: z.number().int().nullable(),
    appointmentFor: z.string(),
    issue: z.string(),
    uploadId: z.string().nullable(),
    relationWithPatient: z.string().nullable(),
    patientName: z.string().nullable(),
    patientAge: z.number().int().nullable(),
    doctor: z.object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
      image: z.string().nullable(),
      role: z.string().nullable(),
    }),
    patient: z.object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
      image: z.string().nullable(),
      role: z.string().nullable(),
    }),
  })
  .describe('Appointment information with related doctor and patient data')

const appointmentListResponseSchema = z
  .object({
    appointments: z.array(appointmentResponseSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
  })
  .describe('List of appointments with pagination')

export const APPOINTMENT_ROUTES = {
  create: createRoute({
    path: '/appointment',
    method: 'post',
    tags: [TAGS.appointment],
    middleware: [isAuthenticated],
    summary: 'Create a new appointment (Patient only)',
    request: {
      body: jsonContentRequired(createAppointmentBodySchema, 'Request body for creating an appointment'),
    },
    responses: {
      [HttpStatusCodes.CREATED]: jsonContent(
        zodResponseSchema(appointmentResponseSchema),
        'Appointment created successfully'
      ),
      [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
        createErrorSchema(createAppointmentBodySchema),
        'Unprocessable Entity'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.BAD_REQUEST]: jsonContent(zodResponseSchema(), 'Bad Request - Doctor not available'),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(zodResponseSchema(), 'Doctor not found'),
    },
  }),

  getById: createRoute({
    path: '/appointment/{id}',
    method: 'get',
    tags: [TAGS.appointment],
    middleware: [isAuthenticated],
    summary: 'Get appointment by ID',
    request: {
      params: z.object({
        id: z.string().describe('Appointment ID'),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(appointmentResponseSchema),
        'Appointment retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(zodResponseSchema(), 'Appointment not found'),
    },
  }),

  getAll: createRoute({
    path: '/appointments',
    method: 'get',
    tags: [TAGS.appointment],
    middleware: [isAuthenticated],
    summary: 'Get all appointments with filtering',
    request: {
      query: z.object({
        doctorId: z.string().optional().describe('Filter by doctor ID'),
        patientId: z.string().optional().describe('Filter by patient ID'),
        status: z.enum(['BOOKED', 'COMPLETED', 'NO_SHOW']).optional().describe('Filter by status'),
        page: z.string().optional().describe('Page number (default: 1)'),
        limit: z.string().optional().describe('Items per page (default: 10)'),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(appointmentListResponseSchema),
        'Appointments retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
    },
  }),

  updateStatus: createRoute({
    path: '/appointment/{id}/status',
    method: 'patch',
    tags: [TAGS.appointment],
    middleware: [isAuthenticated],
    summary: 'Update appointment status',
    request: {
      params: z.object({
        id: z.string().describe('Appointment ID'),
      }),
      body: jsonContentRequired(
        z.object({
          status: z.enum(['BOOKED', 'COMPLETED', 'NO_SHOW']).describe('New appointment status'),
        }),
        'Request body for updating appointment status'
      ),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(appointmentResponseSchema),
        'Appointment status updated successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(zodResponseSchema(), 'Appointment not found'),
      [HttpStatusCodes.BAD_REQUEST]: jsonContent(zodResponseSchema(), 'Bad Request'),
    },
  }),
}


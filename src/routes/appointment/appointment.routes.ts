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
    scheduledAt: z
      .string()
      .datetime()
      .optional()
      .describe('Scheduled date and time in UTC (ISO 8601 format)'),
    relationWithPatient: z
      .string()
      .optional()
      .describe('Relation with patient (required if appointmentFor is "someone else")'),
    patientName: z
      .string()
      .optional()
      .describe('Patient name (required if appointmentFor is "someone else")'),
    patientAge: z
      .number()
      .int()
      .positive()
      .optional()
      .describe('Patient age (required if appointmentFor is "someone else")'),
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
      employeeCode: z.string().nullable(),
    }),
    patient: z.object({
      id: z.string(),
      name: z.string().nullable(),
      email: z.string().nullable(),
      image: z.string().nullable(),
      role: z.string().nullable(),
      employeeCode: z.string().nullable(),
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

const doctorMonthlyStatsResponseSchema = z
  .object({
    month: z.number().int().min(1).max(12).describe('Month number (1-12)'),
    year: z.number().int().describe('Full year (e.g. 2026)'),
    totalAppointments: z.number().int().describe('Total appointments for the month'),
    completedAppointments: z.number().int().describe('Completed appointments for the month'),
  })
  .describe('Monthly appointment statistics for a doctor')

const patientActivityDaySchema = z
  .object({
    weekday: z
      .enum(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
      .describe('Weekday label for the activity bar'),
    date: z.string().datetime().describe('Date in UTC (ISO 8601 format)'),
    count: z.number().int().describe('Number of completed sessions on this day'),
  })
  .describe('Patient activity for a single day')

const patientActivityStatsResponseSchema = z
  .object({
    weekStart: z
      .string()
      .datetime()
      .describe('Start of the week (Monday) in UTC (ISO 8601 format)'),
    weekEnd: z.string().datetime().describe('End of the week (Sunday) in UTC (ISO 8601 format)'),
    days: z.array(patientActivityDaySchema).length(7).describe('Activity per weekday (Mon-Sun)'),
  })
  .describe('Weekly activity stats for a patient (for activity graph)')

const appointmentNotesResponseSchema = z
  .object({
    id: z.string(),
    appointmentId: z.string(),
    doctorId: z.string(),
    notes: z.string(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .describe('Appointment notes (doctor-only)')

export const APPOINTMENT_ROUTES = {
  create: createRoute({
    path: '/appointment',
    method: 'post',
    tags: [TAGS.appointment],
    middleware: [isAuthenticated],
    summary: 'Create a new appointment (Patient only)',
    request: {
      body: jsonContentRequired(
        createAppointmentBodySchema,
        'Request body for creating an appointment'
      ),
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
      [HttpStatusCodes.BAD_REQUEST]: jsonContent(
        zodResponseSchema(),
        'Bad Request - Doctor not available'
      ),
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

  getByIdFull: createRoute({
    path: '/appointment/{id}/full',
    method: 'get',
    tags: [TAGS.appointment],
    middleware: [isAuthenticated],
    summary: 'Get appointment by ID with full doctor and patient details',
    request: {
      params: z.object({
        id: z.string().describe('Appointment ID'),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(z.any()),
        'Appointment with full details retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(zodResponseSchema(), 'Appointment not found'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(zodResponseSchema(), 'Forbidden'),
    },
  }),

  getPatientAppointments: createRoute({
    path: '/appointments/patient',
    method: 'get',
    tags: [TAGS.appointment],
    middleware: [isAuthenticated],
    summary: 'Get all appointments for authenticated patient with status filter',
    request: {
      query: z.object({
        status: z
          .enum(['BOOKED', 'COMPLETED', 'NO_SHOW'])
          .optional()
          .describe('Filter by appointment status'),
        page: z.string().optional().describe('Page number (default: 1)'),
        limit: z.string().optional().describe('Items per page (default: 10)'),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(z.any()),
        'Patient appointments retrieved successfully with full doctor details'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        zodResponseSchema(),
        'Only patients can access this endpoint'
      ),
    },
  }),

  getDoctorAppointments: createRoute({
    path: '/appointments/doctor',
    method: 'get',
    tags: [TAGS.appointment],
    middleware: [isAuthenticated],
    summary: 'Get all appointments for authenticated doctor with status filter',
    request: {
      query: z.object({
        status: z
          .enum(['BOOKED', 'COMPLETED', 'NO_SHOW'])
          .optional()
          .describe('Filter by appointment status'),
        page: z.string().optional().describe('Page number (default: 1)'),
        limit: z.string().optional().describe('Items per page (default: 10)'),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(z.any()),
        'Doctor appointments retrieved successfully with full patient details'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        zodResponseSchema(),
        'Only doctors can access this endpoint'
      ),
    },
  }),

  /**
   * Doctor dashboard: last 4 completed sessions (session history)
   */
  getDoctorSessionHistory: createRoute({
    path: '/appointments/doctor/session-history',
    method: 'get',
    tags: [TAGS.appointment],
    middleware: [isAuthenticated],
    summary: 'Get last completed sessions for authenticated doctor (default last 4)',
    request: {
      query: z.object({
        limit: z.string().optional().describe('Number of records to return (default: 4)'),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(z.any()),
        'Doctor session history retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        zodResponseSchema(),
        'Only doctors can access this endpoint'
      ),
    },
  }),

  /**
   * Doctor dashboard: last 3 session reasons
   */
  getDoctorSessionReasonHistory: createRoute({
    path: '/appointments/doctor/session-reasons',
    method: 'get',
    tags: [TAGS.appointment],
    middleware: [isAuthenticated],
    summary: 'Get last session reasons for authenticated doctor (default last 3)',
    request: {
      query: z.object({
        limit: z.string().optional().describe('Number of records to return (default: 3)'),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(z.any()),
        'Doctor session reason history retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        zodResponseSchema(),
        'Only doctors can access this endpoint'
      ),
    },
  }),

  /**
   * Doctor dashboard: full session reason history (paginated)
   */
  getDoctorFullSessionReasonHistory: createRoute({
    path: '/appointments/doctor/session-reasons/full',
    method: 'get',
    tags: [TAGS.appointment],
    middleware: [isAuthenticated],
    summary: 'Get full session reason history for authenticated doctor (paginated)',
    request: {
      query: z.object({
        page: z.string().optional().describe('Page number (default: 1)'),
        limit: z.string().optional().describe('Items per page (default: 10)'),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(z.any()),
        'Doctor full session reason history retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        zodResponseSchema(),
        'Only doctors can access this endpoint'
      ),
    },
  }),

  /**
   * Doctor dashboard: yearly session reason stats (for graphs)
   */
  getDoctorYearlySessionReasonStats: createRoute({
    path: '/appointments/doctor/session-reasons/stats/yearly',
    method: 'get',
    tags: [TAGS.appointment],
    middleware: [isAuthenticated],
    summary: 'Get yearly session reason stats for authenticated doctor (per month, per reason)',
    request: {
      query: z.object({
        year: z.string().describe('Full year (e.g. 2026)'),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(
          z.object({
            year: z.number().int(),
            months: z.array(
              z.object({
                month: z.number().int().min(1).max(12),
                LETTING_OFF_STEAM: z.number().int(),
                TALKING_THROUGH_STRESS_OR_UNCERTAINTY: z.number().int(),
                NEEDING_PERSPECTIVE_DURING_A_DEMANDING_PERIOD: z.number().int(),
                total: z.number().int(),
              })
            ),
          })
        ),
        'Doctor yearly session reason stats retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        zodResponseSchema(),
        'Only doctors can access this endpoint'
      ),
      [HttpStatusCodes.BAD_REQUEST]: jsonContent(zodResponseSchema(), 'Bad Request'),
    },
  }),

  /**
   * Patient dashboard: last 5 completed sessions (session history)
   */
  getPatientSessionHistory: createRoute({
    path: '/appointments/patient/session-history',
    method: 'get',
    tags: [TAGS.appointment],
    middleware: [isAuthenticated],
    summary: 'Get last completed sessions for authenticated patient (default last 5)',
    request: {
      query: z.object({
        limit: z.string().optional().describe('Number of records to return (default: 5)'),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(z.any()),
        'Patient session history retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        zodResponseSchema(),
        'Only patients can access this endpoint'
      ),
    },
  }),

  /**
   * Patient dashboard: monthly appointment stats
   */
  getPatientMonthlyStats: createRoute({
    path: '/appointments/patient/stats/monthly',
    method: 'get',
    tags: [TAGS.appointment],
    middleware: [isAuthenticated],
    summary: 'Get monthly appointment statistics for authenticated patient',
    request: {
      query: z.object({
        month: z.string().describe('Month number (1-12)'),
        year: z.string().describe('Full year (e.g. 2026)'),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(doctorMonthlyStatsResponseSchema),
        'Patient monthly appointment stats retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        zodResponseSchema(),
        'Only patients can access this endpoint'
      ),
      [HttpStatusCodes.BAD_REQUEST]: jsonContent(zodResponseSchema(), 'Bad Request'),
    },
  }),

  /**
   * Patient dashboard: weekly activity stats (for activity graph)
   */
  getPatientWeeklyActivityStats: createRoute({
    path: '/appointments/patient/stats/activity',
    method: 'get',
    tags: [TAGS.appointment],
    middleware: [isAuthenticated],
    summary:
      'Get weekly activity stats for authenticated patient (Mon-Sun completed sessions for activity graph)',
    request: {
      query: z.object({
        referenceDate: z
          .string()
          .datetime()
          .optional()
          .describe(
            'Reference date in UTC (ISO 8601 format). Defaults to current date on server if not provided.'
          ),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(patientActivityStatsResponseSchema),
        'Patient weekly activity stats retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        zodResponseSchema(),
        'Only patients can access this endpoint'
      ),
      [HttpStatusCodes.BAD_REQUEST]: jsonContent(zodResponseSchema(), 'Bad Request'),
    },
  }),

  /**
   * Doctor dashboard: monthly appointment stats
   */
  getDoctorMonthlyStats: createRoute({
    path: '/appointments/doctor/stats/monthly',
    method: 'get',
    tags: [TAGS.appointment],
    middleware: [isAuthenticated],
    summary: 'Get monthly appointment statistics for authenticated doctor',
    request: {
      query: z.object({
        month: z.string().describe('Month number (1-12)'),
        year: z.string().describe('Full year (e.g. 2026)'),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(doctorMonthlyStatsResponseSchema),
        'Doctor monthly appointment stats retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        zodResponseSchema(),
        'Only doctors can access this endpoint'
      ),
      [HttpStatusCodes.BAD_REQUEST]: jsonContent(zodResponseSchema(), 'Bad Request'),
    },
  }),

  updateStartedAt: createRoute({
    path: '/appointment/{id}',
    method: 'patch',
    tags: [TAGS.appointment],
    middleware: [isAuthenticated],
    summary: 'Update appointment startedAt timestamp (Doctor only)',
    description:
      'Allows doctors to set or update the startedAt timestamp for an appointment. If startedAt is not provided in the request body, it will default to the current time.',
    request: {
      params: z.object({
        id: z.string().describe('Appointment ID'),
      }),
      body: jsonContent(
        z
          .object({
            startedAt: z
              .string()
              .datetime()
              .optional()
              .describe(
                'Start time in UTC (ISO 8601 format). If not provided, current time will be used.'
              ),
          })
          .describe('Request body for updating appointment startedAt'),
        'Request body for updating appointment startedAt'
      ),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(appointmentResponseSchema),
        'Appointment startedAt updated successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(zodResponseSchema(), 'Appointment not found'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        zodResponseSchema(),
        'Only the doctor can update this appointment'
      ),
      [HttpStatusCodes.BAD_REQUEST]: jsonContent(zodResponseSchema(), 'Bad Request'),
    },
  }),

  markAsCompleted: createRoute({
    path: '/appointment/{id}/complete',
    method: 'patch',
    tags: [TAGS.appointment],
    middleware: [isAuthenticated],
    summary: 'Mark appointment as completed (Doctor only)',
    request: {
      params: z.object({
        id: z.string().describe('Appointment ID'),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(appointmentResponseSchema),
        'Appointment marked as completed successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(zodResponseSchema(), 'Appointment not found'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        zodResponseSchema(),
        'Only the doctor can mark appointment as completed'
      ),
      [HttpStatusCodes.BAD_REQUEST]: jsonContent(
        zodResponseSchema(),
        'Bad Request - Appointment already completed or invalid status'
      ),
    },
  }),

  submitSessionReason: createRoute({
    path: '/appointment/{id}/session-reason',
    method: 'post',
    tags: [TAGS.appointment],
    summary: 'Submit session reason for completed appointment (Doctor only)',
    description:
      'Allows doctors to submit or update the purpose/reason for a completed appointment. The reason helps categorize why the patient sought the session.',
    middleware: [isAuthenticated],
    request: {
      params: z.object({
        id: z.string().describe('Appointment ID'),
      }),
      body: jsonContentRequired(
        z
          .object({
            reason: z
              .enum([
                'LETTING_OFF_STEAM',
                'TALKING_THROUGH_STRESS_OR_UNCERTAINTY',
                'NEEDING_PERSPECTIVE_DURING_A_DEMANDING_PERIOD',
              ])
              .describe('The reason/purpose for the appointment session'),
          })
          .describe('Request body for submitting session reason'),
        'Request body for submitting session reason'
      ),
    },
    responses: {
      [HttpStatusCodes.CREATED]: jsonContent(
        zodResponseSchema(
          z.object({
            id: z.string(),
            appointmentId: z.string(),
            reason: z.enum([
              'LETTING_OFF_STEAM',
              'TALKING_THROUGH_STRESS_OR_UNCERTAINTY',
              'NEEDING_PERSPECTIVE_DURING_A_DEMANDING_PERIOD',
            ]),
            createdAt: z.string().datetime(),
            updatedAt: z.string().datetime(),
          })
        ),
        'Session reason submitted successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(zodResponseSchema(), 'Appointment not found'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        zodResponseSchema(),
        'Only the doctor can submit session reason for this appointment'
      ),
      [HttpStatusCodes.BAD_REQUEST]: jsonContent(
        zodResponseSchema(),
        'Bad Request - Session reason can only be submitted for completed appointments'
      ),
    },
  }),

  /**
   * Appointment notes: create or update notes for an appointment (Doctor only)
   */
  upsertAppointmentNotes: createRoute({
    path: '/appointment/{id}/notes',
    method: 'post',
    tags: [TAGS.appointment],
    middleware: [isAuthenticated],
    summary: 'Create or update appointment notes (Doctor only)',
    request: {
      params: z.object({
        id: z.string().describe('Appointment ID'),
      }),
      body: jsonContentRequired(
        z
          .object({
            notes: z.string().min(1).describe('Notes for this appointment (internal doctor notes)'),
          })
          .describe('Request body for creating or updating appointment notes'),
        'Request body for creating or updating appointment notes'
      ),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(appointmentNotesResponseSchema),
        'Appointment notes created or updated successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        zodResponseSchema(),
        'Only the assigned doctor can manage notes for this appointment'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(zodResponseSchema(), 'Appointment not found'),
      [HttpStatusCodes.BAD_REQUEST]: jsonContent(zodResponseSchema(), 'Bad Request'),
    },
  }),

  /**
   * Appointment notes: fetch notes for an appointment (Doctor only)
   */
  getAppointmentNotes: createRoute({
    path: '/appointment/{id}/notes',
    method: 'get',
    tags: [TAGS.appointment],
    middleware: [isAuthenticated],
    summary: 'Get appointment notes (Doctor only)',
    request: {
      params: z.object({
        id: z.string().describe('Appointment ID'),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(appointmentNotesResponseSchema),
        'Appointment notes retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        zodResponseSchema(),
        'Only the assigned doctor can view notes for this appointment'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(zodResponseSchema(), 'Appointment notes not found'),
    },
  }),
}

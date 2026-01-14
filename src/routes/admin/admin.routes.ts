import { createRoute, z } from '@hono/zod-openapi'
import * as HttpStatusCodes from 'stoker/http-status-codes'
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers'
import { createErrorSchema } from 'stoker/openapi/schemas'
import TAGS from '~/config/tags'
import { zodResponseSchema } from '~/lib/zod-helper'

const doctorRequestResponseSchema = z
  .object({
    id: z.string(),
    userid: z.string(),
    professional_contact: z.string(),
    professional_email: z.string(),
    secondary_contact: z.string().nullable(),
    isAvailable: z.boolean(),
    isInMeeting: z.boolean(),
    rejectReason: z.string().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    user: z.object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
      image: z.string().nullable(),
      role: z.string().nullable(),
      onboardingStage: z.string().nullable(),
      createdAt: z.string().datetime(),
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
  .describe('Doctor request with full profile information')

const doctorRequestsListResponseSchema = z
  .object({
    doctors: z.array(doctorRequestResponseSchema),
    pagination: z.object({
      page: z.number().int(),
      limit: z.number().int(),
      total: z.number().int(),
      totalPages: z.number().int(),
    }),
  })
  .describe('List of doctor requests with pagination')

const approveDoctorBodySchema = z
  .object({
    doctorId: z.string().describe('Doctor ID to approve'),
  })
  .describe('Request body for approving a doctor')

const rejectDoctorBodySchema = z
  .object({
    doctorId: z.string().describe('Doctor ID to reject'),
    rejectReason: z.string().min(1).describe('Reason for rejection'),
  })
  .describe('Request body for rejecting a doctor')

const doctorStatusResponseSchema = z
  .object({
    id: z.string(),
    userid: z.string(),
    professional_contact: z.string(),
    professional_email: z.string(),
    rejectReason: z.string().nullable(),
    user: z.object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
      onboardingStage: z.string().nullable(),
    }),
  })
  .describe('Doctor status response after approval or rejection')

export const ADMIN_ROUTES = {
  getDoctorRequests: createRoute({
    path: '/admin/doctor-requests',
    method: 'get',
    tags: [TAGS.doctor],
    summary: 'Get all pending doctor requests (Admin only)',
    request: {
      query: z.object({
        page: z.string().optional().describe('Page number (default: 1)'),
        limit: z.string().optional().describe('Items per page (default: 10)'),
        search: z.string().optional().describe('Search by name, email, or professional email'),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(doctorRequestsListResponseSchema),
        'Doctor requests retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(zodResponseSchema(), 'Forbidden - Admin only'),
    },
  }),

  approveDoctor: createRoute({
    path: '/admin/doctor-requests/approve',
    method: 'post',
    tags: [TAGS.doctor],
    summary: 'Approve a doctor request (Admin only)',
    request: {
      body: jsonContentRequired(approveDoctorBodySchema, 'Request body for approving a doctor'),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(doctorStatusResponseSchema),
        'Doctor approved successfully'
      ),
      [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
        createErrorSchema(approveDoctorBodySchema),
        'Unprocessable Entity'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(zodResponseSchema(), 'Forbidden - Admin only'),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(zodResponseSchema(), 'Doctor not found'),
    },
  }),

  rejectDoctor: createRoute({
    path: '/admin/doctor-requests/reject',
    method: 'post',
    tags: [TAGS.doctor],
    summary: 'Reject a doctor request (Admin only)',
    request: {
      body: jsonContentRequired(rejectDoctorBodySchema, 'Request body for rejecting a doctor'),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(doctorStatusResponseSchema),
        'Doctor rejected successfully'
      ),
      [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
        createErrorSchema(rejectDoctorBodySchema),
        'Unprocessable Entity'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(zodResponseSchema(), 'Forbidden - Admin only'),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(zodResponseSchema(), 'Doctor not found'),
    },
  }),
}

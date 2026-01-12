import { createRoute, z } from '@hono/zod-openapi'
import * as HttpStatusCodes from 'stoker/http-status-codes'
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers'
import { createErrorSchema } from 'stoker/openapi/schemas'
import TAGS from '~/config/tags'
import { zodResponseSchema } from '~/lib/zod-helper'

const patientSignupBodySchema = z
  .object({
    name: z.string().min(1).max(100).describe('Patient name'),
    email: z.string().email().describe('Patient email address'),
    password: z.string().min(8).describe('Password (minimum 8 characters)'),
    enterpriseCode: z.string().min(1).max(50).describe('Enterprise code'),
  })
  .describe('Request body for patient signup')

const doctorSignupBodySchema = z
  .object({
    name: z.string().min(1).max(100).describe('Doctor name'),
    email: z.string().email().describe('Doctor email address'),
    password: z.string().min(8).describe('Password (minimum 8 characters)'),
  })
  .describe('Request body for doctor signup')

const patientSignupResponseSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    role: z.string().nullable(),
    enterpriseCode: z.string().nullable(),
    employeeCode: z.string().nullable(),
    onboardingStage: z.string().nullable(),
  })
  .describe('Patient signup response')

const doctorSignupResponseSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    role: z.string().nullable(),
    onboardingStage: z.string().nullable(),
  })
  .describe('Doctor signup response')

export const AUTH_ROUTES = {
  patientSignup: createRoute({
    path: '/auth/patient/signup',
    method: 'post',
    tags: [TAGS.auth],
    summary: 'Sign up a new patient with enterprise code',
    request: {
      body: jsonContentRequired(patientSignupBodySchema, 'Request body for patient signup'),
    },
    responses: {
      [HttpStatusCodes.CREATED]: jsonContent(
        zodResponseSchema(patientSignupResponseSchema),
        'Patient signed up successfully'
      ),
      [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
        createErrorSchema(patientSignupBodySchema),
        'Unprocessable Entity'
      ),
      [HttpStatusCodes.BAD_REQUEST]: jsonContent(
        zodResponseSchema(),
        'Bad Request - Invalid enterprise code or email already exists'
      ),
      [HttpStatusCodes.CONFLICT]: jsonContent(zodResponseSchema(), 'Email already exists'),
    },
  }),

  doctorSignup: createRoute({
    path: '/auth/doctor/signup',
    method: 'post',
    tags: [TAGS.auth],
    summary: 'Sign up a new doctor',
    request: {
      body: jsonContentRequired(doctorSignupBodySchema, 'Request body for doctor signup'),
    },
    responses: {
      [HttpStatusCodes.CREATED]: jsonContent(
        zodResponseSchema(doctorSignupResponseSchema),
        'Doctor signed up successfully'
      ),
      [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
        createErrorSchema(doctorSignupBodySchema),
        'Unprocessable Entity'
      ),
      [HttpStatusCodes.BAD_REQUEST]: jsonContent(zodResponseSchema(), 'Bad Request'),
      [HttpStatusCodes.CONFLICT]: jsonContent(zodResponseSchema(), 'Email already exists'),
    },
  }),
}

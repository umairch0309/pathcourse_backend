import { createRoute, z } from '@hono/zod-openapi'
import * as HttpStatusCodes from 'stoker/http-status-codes'
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers'
import { createErrorSchema } from 'stoker/openapi/schemas'
import TAGS from '~/config/tags'
import { zodResponseSchema } from '~/lib/zod-helper'

const selectRoleBodySchema = z
  .object({
    role: z.enum(['patient', 'doctor']).describe('User role to select'),
  })
  .describe('Request body for selecting user role')

const userInfoBodySchema = z
  .object({
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
  .describe('Request body for creating or updating user info')

const userInfoResponseSchema = z
  .object({
    id: z.string().nullable(),
    userId: z.string(),
    gender: z.string().nullable(),
    dateOfBirth: z.string().datetime().nullable(),
    phone: z.string().nullable(),
    address: z.string().nullable(),
    createdAt: z.string().datetime().nullable(),
    updatedAt: z.string().datetime().nullable(),
    user: z.object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
      image: z.string().nullable(),
      role: z.string().nullable(),
      employeeCode: z.string().nullable(),
      isAnonymous: z.boolean(),
    }),
  })
  .describe('User info with related user data (null values when user info not created yet)')

const updateUserProfileBodySchema = z
  .object({
    name: z.string().min(1).max(100).optional().describe('User full name'),
    image: z.string().max(500).nullable().optional().describe('User profile image URL'),
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
  .describe('Request body for updating user and patient info (Patient only)')

export const USER_ROUTES = {
  selectRole: createRoute({
    path: '/user/select-role',
    method: 'post',
    tags: [TAGS.user],
    summary: 'Select user role (patient or doctor)',
    request: {
      body: jsonContentRequired(selectRoleBodySchema, 'Request body for selecting user role'),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(zodResponseSchema(), 'Role selected successfully'),
      [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
        createErrorSchema(selectRoleBodySchema),
        'Unprocessable Entity'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.BAD_REQUEST]: jsonContent(zodResponseSchema(), 'Bad Request'),
    },
  }),

  createOrUpdateUserInfo: createRoute({
    path: '/user/info',
    method: 'post',
    tags: [TAGS.user],
    summary: 'Create or update user information',
    request: {
      body: jsonContentRequired(userInfoBodySchema, 'Request body for user info'),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(userInfoResponseSchema),
        'User info created or updated successfully'
      ),
      [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
        createErrorSchema(userInfoBodySchema),
        'Unprocessable Entity'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.BAD_REQUEST]: jsonContent(zodResponseSchema(), 'Bad Request'),
    },
  }),

  getPatientProfile: createRoute({
    path: '/patient/profile',
    method: 'get',
    tags: [TAGS.user],
    summary: 'Get current patient profile (user + patient info)',
    request: {},
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(userInfoResponseSchema),
        'Patient profile retrieved successfully (returns default structure if user info not created yet)'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        zodResponseSchema(),
        'Forbidden - Only patients can access this endpoint'
      ),
    },
  }),

  updateUserProfile: createRoute({
    path: '/user/profile',
    method: 'put',
    tags: [TAGS.user],
    summary: 'Update user basic profile and patient info (Patient only)',
    request: {
      body: jsonContentRequired(
        updateUserProfileBodySchema,
        'Request body for updating user and patient info'
      ),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(userInfoResponseSchema),
        'User profile updated successfully'
      ),
      [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
        createErrorSchema(updateUserProfileBodySchema),
        'Unprocessable Entity'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        zodResponseSchema(),
        'Forbidden - Only patients can access this endpoint'
      ),
      [HttpStatusCodes.BAD_REQUEST]: jsonContent(zodResponseSchema(), 'Bad Request'),
    },
  }),

  getUserInfo: createRoute({
    path: '/user/info',
    method: 'get',
    tags: [TAGS.user],
    summary: 'Get current user information',
    request: {},
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(userInfoResponseSchema),
        'User info retrieved successfully (returns default structure if user info not created yet)'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
    },
  }),

  toggleAnonymousMode: createRoute({
    path: '/user/anonymous',
    method: 'post',
    tags: [TAGS.user],
    summary: 'Toggle anonymous mode for patient (hide name/email, only show employee ID)',
    request: {},
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(
          z.object({
            id: z.string(),
            name: z.string(),
            email: z.string(),
            role: z.string().nullable(),
            isAnonymous: z.boolean(),
            employeeCode: z.string().nullable(),
          })
        ),
        'Anonymous mode toggled successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        zodResponseSchema(),
        'Only patients can use anonymous mode'
      ),
      [HttpStatusCodes.BAD_REQUEST]: jsonContent(zodResponseSchema(), 'Bad Request'),
    },
  }),
}

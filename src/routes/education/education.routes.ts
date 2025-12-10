import { createRoute, z } from '@hono/zod-openapi'
import * as HttpStatusCodes from 'stoker/http-status-codes'
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers'
import { createErrorSchema } from 'stoker/openapi/schemas'
import TAGS from '~/config/tags'
import { zodResponseSchema } from '~/lib/zod-helper'
import { isAuthenticated } from '~/middleware/is-authenticated'

const educationItemSchema = z
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
  .describe('Education information item')

const bulkCreateEducationBodySchema = z
  .object({
    educations: z
      .array(educationItemSchema)
      .min(1)
      .describe('Array of education records to create'),
  })
  .describe('Request body for bulk creating education records')

const updateEducationBodySchema = z
  .object({
    degree: z.string().min(1).max(100).optional().describe('Degree or qualification name'),
    startYear: z.string().datetime().optional().describe('Start year in UTC (ISO 8601 format)'),
    endYear: z
      .string()
      .datetime()
      .nullable()
      .optional()
      .describe('End year in UTC (ISO 8601 format)'),
    document: z
      .string()
      .url()
      .max(500)
      .nullable()
      .optional()
      .describe('Document URL (e.g., certificate)'),
    institution_name: z.string().min(1).max(200).optional().describe('Institution name'),
  })
  .describe('Request body for updating education record')

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

const educationListResponseSchema = z
  .object({
    educations: z.array(educationResponseSchema),
  })
  .describe('List of education records')

export const EDUCATION_ROUTES = {
  bulkCreate: createRoute({
    path: '/education',
    method: 'post',
    tags: [TAGS.education],
    middleware: [isAuthenticated],
    summary: 'Bulk create education records (Doctor only)',
    request: {
      body: jsonContentRequired(
        bulkCreateEducationBodySchema,
        'Request body for bulk creating education records'
      ),
    },
    responses: {
      [HttpStatusCodes.CREATED]: jsonContent(
        zodResponseSchema(educationListResponseSchema),
        'Education records created successfully'
      ),
      [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
        createErrorSchema(bulkCreateEducationBodySchema),
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

  getAll: createRoute({
    path: '/education',
    method: 'get',
    tags: [TAGS.education],
    middleware: [isAuthenticated],
    summary: 'Get all education records for current doctor (Doctor only)',
    request: {},
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(educationListResponseSchema),
        'Education records retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        zodResponseSchema(),
        'Forbidden - Only doctors can access this endpoint'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(zodResponseSchema(), 'Doctor not found'),
    },
  }),

  getById: createRoute({
    path: '/education/{id}',
    method: 'get',
    tags: [TAGS.education],
    summary: 'Get education record by ID (Public)',
    request: {
      params: z.object({
        id: z.string().describe('Education record ID'),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(educationResponseSchema),
        'Education record retrieved successfully'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(zodResponseSchema(), 'Education record not found'),
    },
  }),

  update: createRoute({
    path: '/education/{id}',
    method: 'put',
    tags: [TAGS.education],
    middleware: [isAuthenticated],
    summary: 'Update education record (Doctor only)',
    request: {
      params: z.object({
        id: z.string().describe('Education record ID'),
      }),
      body: jsonContentRequired(
        updateEducationBodySchema,
        'Request body for updating education record'
      ),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(educationResponseSchema),
        'Education record updated successfully'
      ),
      [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
        createErrorSchema(updateEducationBodySchema),
        'Unprocessable Entity'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(
        zodResponseSchema(),
        'Forbidden - Only doctors can access this endpoint'
      ),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(zodResponseSchema(), 'Education record not found'),
    },
  }),

  delete: createRoute({
    path: '/education/{id}',
    method: 'delete',
    tags: [TAGS.education],
    middleware: [isAuthenticated],
    summary: 'Delete education record (Doctor only)',
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

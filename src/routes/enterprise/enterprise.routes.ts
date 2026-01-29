import { createRoute, z } from '@hono/zod-openapi'
import * as HttpStatusCodes from 'stoker/http-status-codes'
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers'
import { createErrorSchema } from 'stoker/openapi/schemas'
import TAGS from '~/config/tags'
import { zodResponseSchema } from '~/lib/zod-helper'

const createEnterpriseBodySchema = z
  .object({
    name: z.string().min(1).max(200).describe('Enterprise name'),
    code: z
      .string()
      .min(1)
      .max(50)
      .optional()
      .describe('Enterprise code (optional, will be generated if not provided)'),
    sessionsPerMonth: z.number().int().min(0).describe('Number of sessions allowed per month'),
    generateCode: z
      .boolean()
      .optional()
      .default(false)
      .describe('Generate code automatically from enterprise name'),
  })
  .describe('Request body for creating enterprise')

const updateEnterpriseBodySchema = z
  .object({
    name: z.string().min(1).max(200).optional().describe('Enterprise name'),
    code: z.string().min(1).max(50).optional().describe('Enterprise code'),
    sessionsPerMonth: z
      .number()
      .int()
      .min(0)
      .optional()
      .describe('Number of sessions allowed per month'),
  })
  .describe('Request body for updating enterprise')

const enterpriseResponseSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    code: z.string(),
    sessionsPerMonth: z.number().int(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .describe('Enterprise response')

const enterpriseListResponseSchema = z
  .object({
    enterprises: z.array(enterpriseResponseSchema),
    pagination: z.object({
      page: z.number().int(),
      limit: z.number().int(),
      total: z.number().int(),
      totalPages: z.number().int(),
    }),
  })
  .describe('Enterprise list response with pagination')

export const ENTERPRISE_ROUTES = {
  create: createRoute({
    path: '/enterprises',
    method: 'post',
    tags: [TAGS.enterprise],
    summary: 'Create a new enterprise (Admin only)',
    request: {
      body: jsonContentRequired(createEnterpriseBodySchema, 'Request body for creating enterprise'),
    },
    responses: {
      [HttpStatusCodes.CREATED]: jsonContent(
        zodResponseSchema(enterpriseResponseSchema),
        'Enterprise created successfully'
      ),
      [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
        createErrorSchema(createEnterpriseBodySchema),
        'Unprocessable Entity'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(zodResponseSchema(), 'Forbidden - Admin only'),
      [HttpStatusCodes.BAD_REQUEST]: jsonContent(
        zodResponseSchema(),
        'Bad Request - Name or code already exists'
      ),
    },
  }),

  getAll: createRoute({
    path: '/enterprises',
    method: 'get',
    tags: [TAGS.enterprise],
    summary: 'Get all enterprises with pagination (Admin only)',
    request: {
      query: z.object({
        page: z.string().optional().describe('Page number (default: 1)'),
        limit: z.string().optional().describe('Items per page (default: 10)'),
        search: z.string().optional().describe('Search by name or code'),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(enterpriseListResponseSchema),
        'Enterprises retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(zodResponseSchema(), 'Forbidden - Admin only'),
    },
  }),

  getById: createRoute({
    path: '/enterprises/{id}',
    method: 'get',
    tags: [TAGS.enterprise],
    summary: 'Get enterprise by ID (Admin only)',
    request: {
      params: z.object({
        id: z.string().describe('Enterprise ID'),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(enterpriseResponseSchema),
        'Enterprise retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(zodResponseSchema(), 'Forbidden - Admin only'),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(zodResponseSchema(), 'Enterprise not found'),
    },
  }),

  update: createRoute({
    path: '/enterprises/{id}',
    method: 'put',
    tags: [TAGS.enterprise],
    summary: 'Update enterprise (Admin only)',
    request: {
      params: z.object({
        id: z.string().describe('Enterprise ID'),
      }),
      body: jsonContentRequired(updateEnterpriseBodySchema, 'Request body for updating enterprise'),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(enterpriseResponseSchema),
        'Enterprise updated successfully'
      ),
      [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
        createErrorSchema(updateEnterpriseBodySchema),
        'Unprocessable Entity'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(zodResponseSchema(), 'Forbidden - Admin only'),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(zodResponseSchema(), 'Enterprise not found'),
      [HttpStatusCodes.BAD_REQUEST]: jsonContent(
        zodResponseSchema(),
        'Bad Request - Name or code already exists'
      ),
    },
  }),

  delete: createRoute({
    path: '/enterprises/{id}',
    method: 'delete',
    tags: [TAGS.enterprise],
    summary: 'Delete enterprise (Admin only)',
    request: {
      params: z.object({
        id: z.string().describe('Enterprise ID'),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(zodResponseSchema(), 'Enterprise deleted successfully'),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(zodResponseSchema(), 'Forbidden - Admin only'),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(zodResponseSchema(), 'Enterprise not found'),
    },
  }),
}

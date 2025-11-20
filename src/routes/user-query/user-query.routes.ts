import { createRoute, z } from '@hono/zod-openapi'
import * as HttpStatusCodes from 'stoker/http-status-codes'
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers'
import { createErrorSchema } from 'stoker/openapi/schemas'
import TAGS from '~/config/tags'
import { zodResponseSchema } from '~/lib/zod-helper'

const userQueryResponseSchema = z
  .object({
    id: z.string(),
    message: z.string(),
    name: z.string(),
    number: z.string(),
    email: z.string(),
    userId: z.string().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    user: z
      .object({
        id: z.string(),
        name: z.string(),
        email: z.string(),
      })
      .nullable()
      .optional(),
  })
  .describe('User query information')

const createUserQueryBodySchema = z
  .object({
    message: z.string().min(1).describe('Query message'),
    name: z.string().min(1).max(100).describe('User name'),
    number: z.string().min(1).max(20).describe('User phone number'),
    email: z.string().email().describe('User email address'),
  })
  .describe('Request body for creating user query')

const userQueryListResponseSchema = z
  .object({
    userQueries: z.array(userQueryResponseSchema),
    pagination: z.object({
      page: z.number().int(),
      limit: z.number().int(),
      total: z.number().int(),
      totalPages: z.number().int(),
    }),
  })
  .describe('List of user queries with pagination')

export const USER_QUERY_ROUTES = {
  create: createRoute({
    path: '/user-queries',
    method: 'post',
    tags: [TAGS.userQuery],
    summary: 'Create a new user query (Public - no authentication required)',
    request: {
      body: jsonContentRequired(createUserQueryBodySchema, 'Request body for creating user query'),
    },
    responses: {
      [HttpStatusCodes.CREATED]: jsonContent(
        zodResponseSchema(userQueryResponseSchema),
        'User query created successfully'
      ),
      [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
        createErrorSchema(createUserQueryBodySchema),
        'Unprocessable Entity'
      ),
      [HttpStatusCodes.BAD_REQUEST]: jsonContent(zodResponseSchema(), 'Bad Request'),
    },
  }),

  getAll: createRoute({
    path: '/user-queries',
    method: 'get',
    tags: [TAGS.userQuery],
    summary: 'Get all user queries (Admin only)',
    request: {
      query: z.object({
        page: z.string().optional().describe('Page number (default: 1)'),
        limit: z.string().optional().describe('Items per page (default: 10)'),
        search: z.string().optional().describe('Search term for name, email, number, or message'),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(userQueryListResponseSchema),
        'User queries retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(zodResponseSchema(), 'Forbidden - Admin only'),
    },
  }),

  getById: createRoute({
    path: '/user-queries/{id}',
    method: 'get',
    tags: [TAGS.userQuery],
    summary: 'Get user query by ID (Admin only)',
    request: {
      params: z.object({
        id: z.string().describe('User query ID'),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(userQueryResponseSchema),
        'User query retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(zodResponseSchema(), 'Forbidden - Admin only'),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(zodResponseSchema(), 'User query not found'),
    },
  }),

  delete: createRoute({
    path: '/user-queries/{id}',
    method: 'delete',
    tags: [TAGS.userQuery],
    summary: 'Delete user query by ID (Admin only)',
    request: {
      params: z.object({
        id: z.string().describe('User query ID'),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(zodResponseSchema(), 'User query deleted successfully'),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(zodResponseSchema(), 'Forbidden - Admin only'),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(zodResponseSchema(), 'User query not found'),
    },
  }),
}


import { createRoute, z } from '@hono/zod-openapi'
import * as HttpStatusCodes from 'stoker/http-status-codes'
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers'
import { createErrorSchema } from 'stoker/openapi/schemas'
import TAGS from '~/config/tags'
import { zodResponseSchema } from '~/lib/zod-helper'
import { isAuthenticated } from '~/middleware/is-authenticated'

const permissionResponseSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    description: z.string().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .describe('Permission')

const permissionListResponseSchema = z
  .object({
    permissions: z.array(permissionResponseSchema),
  })
  .describe('List of permissions')

const createPermissionBodySchema = z
  .object({
    name: z.string().min(1).describe('Permission name'),
    slug: z.string().min(1).describe('Permission slug (unique identifier)'),
    description: z.string().optional().describe('Permission description'),
  })
  .describe('Request body for creating a permission')

const updatePermissionBodySchema = z
  .object({
    name: z.string().min(1).optional().describe('Permission name'),
    slug: z.string().min(1).optional().describe('Permission slug'),
    description: z.string().optional().nullable().describe('Permission description'),
  })
  .describe('Request body for updating a permission')

export const PERMISSION_ROUTES = {
  getAll: createRoute({
    path: '/admin/permissions',
    method: 'get',
    tags: [TAGS.permission],
    middleware: [isAuthenticated],
    summary: 'Get all permissions',
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(permissionListResponseSchema),
        'Permissions retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(zodResponseSchema(), 'Forbidden'),
    },
  }),

  getById: createRoute({
    path: '/admin/permissions/{id}',
    method: 'get',
    tags: [TAGS.permission],
    middleware: [isAuthenticated],
    summary: 'Get permission by ID',
    request: {
      params: z.object({
        id: z.string().describe('Permission ID'),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(permissionResponseSchema),
        'Permission retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(zodResponseSchema(), 'Permission not found'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(zodResponseSchema(), 'Forbidden'),
    },
  }),

  create: createRoute({
    path: '/admin/permissions',
    method: 'post',
    tags: [TAGS.permission],
    middleware: [isAuthenticated],
    summary: 'Create a new permission',
    request: {
      body: jsonContentRequired(
        createPermissionBodySchema,
        'Request body for creating a permission'
      ),
    },
    responses: {
      [HttpStatusCodes.CREATED]: jsonContent(
        zodResponseSchema(permissionResponseSchema),
        'Permission created successfully'
      ),
      [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
        createErrorSchema(createPermissionBodySchema),
        'Unprocessable Entity'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.CONFLICT]: jsonContent(zodResponseSchema(), 'Permission already exists'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(zodResponseSchema(), 'Forbidden'),
    },
  }),

  update: createRoute({
    path: '/admin/permissions/{id}',
    method: 'patch',
    tags: [TAGS.permission],
    middleware: [isAuthenticated],
    summary: 'Update a permission',
    request: {
      params: z.object({
        id: z.string().describe('Permission ID'),
      }),
      body: jsonContentRequired(
        updatePermissionBodySchema,
        'Request body for updating a permission'
      ),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(permissionResponseSchema),
        'Permission updated successfully'
      ),
      [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
        createErrorSchema(updatePermissionBodySchema),
        'Unprocessable Entity'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(zodResponseSchema(), 'Permission not found'),
      [HttpStatusCodes.CONFLICT]: jsonContent(
        zodResponseSchema(),
        'Permission slug already exists'
      ),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(zodResponseSchema(), 'Forbidden'),
    },
  }),

  delete: createRoute({
    path: '/admin/permissions/{id}',
    method: 'delete',
    tags: [TAGS.permission],
    middleware: [isAuthenticated],
    summary: 'Delete a permission',
    request: {
      params: z.object({
        id: z.string().describe('Permission ID'),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(z.object({ success: z.boolean() })),
        'Permission deleted successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(zodResponseSchema(), 'Permission not found'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(zodResponseSchema(), 'Forbidden'),
    },
  }),
}

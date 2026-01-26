import { createRoute, z } from '@hono/zod-openapi'
import * as HttpStatusCodes from 'stoker/http-status-codes'
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers'
import { createErrorSchema } from 'stoker/openapi/schemas'
import TAGS from '~/config/tags'
import { zodResponseSchema } from '~/lib/zod-helper'
import { isAuthenticated } from '~/middleware/is-authenticated'

const roleResponseSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    permissions: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        slug: z.string(),
        description: z.string().nullable(),
      })
    ),
  })
  .describe('Role with permissions')

const roleListResponseSchema = z
  .object({
    roles: z.array(roleResponseSchema),
  })
  .describe('List of roles')

const createRoleBodySchema = z
  .object({
    name: z.string().min(1).describe('Role name'),
    description: z.string().optional().describe('Role description'),
  })
  .describe('Request body for creating a role')

const updateRoleBodySchema = z
  .object({
    name: z.string().min(1).optional().describe('Role name'),
    description: z.string().optional().nullable().describe('Role description'),
  })
  .describe('Request body for updating a role')

const assignPermissionsBodySchema = z
  .object({
    permissionIds: z.array(z.string()).describe('Array of permission IDs to assign'),
  })
  .describe('Request body for assigning permissions to a role')

export const ROLE_ROUTES = {
  getAll: createRoute({
    path: '/admin/roles',
    method: 'get',
    tags: [TAGS.role],
    middleware: [isAuthenticated],
    summary: 'Get all roles with permissions',
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(roleListResponseSchema),
        'Roles retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(zodResponseSchema(), 'Forbidden'),
    },
  }),

  getById: createRoute({
    path: '/admin/roles/{id}',
    method: 'get',
    tags: [TAGS.role],
    middleware: [isAuthenticated],
    summary: 'Get role by ID with permissions',
    request: {
      params: z.object({
        id: z.string().describe('Role ID'),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(roleResponseSchema),
        'Role retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(zodResponseSchema(), 'Role not found'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(zodResponseSchema(), 'Forbidden'),
    },
  }),

  create: createRoute({
    path: '/admin/roles',
    method: 'post',
    tags: [TAGS.role],
    middleware: [isAuthenticated],
    summary: 'Create a new role',
    request: {
      body: jsonContentRequired(createRoleBodySchema, 'Request body for creating a role'),
    },
    responses: {
      [HttpStatusCodes.CREATED]: jsonContent(
        zodResponseSchema(
          z.object({
            id: z.string(),
            name: z.string(),
            description: z.string().nullable(),
            createdAt: z.string().datetime(),
            updatedAt: z.string().datetime(),
          })
        ),
        'Role created successfully'
      ),
      [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
        createErrorSchema(createRoleBodySchema),
        'Unprocessable Entity'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.CONFLICT]: jsonContent(zodResponseSchema(), 'Role already exists'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(zodResponseSchema(), 'Forbidden'),
    },
  }),

  update: createRoute({
    path: '/admin/roles/{id}',
    method: 'patch',
    tags: [TAGS.role],
    middleware: [isAuthenticated],
    summary: 'Update a role',
    request: {
      params: z.object({
        id: z.string().describe('Role ID'),
      }),
      body: jsonContentRequired(updateRoleBodySchema, 'Request body for updating a role'),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(
          z.object({
            id: z.string(),
            name: z.string(),
            description: z.string().nullable(),
            createdAt: z.string().datetime(),
            updatedAt: z.string().datetime(),
          })
        ),
        'Role updated successfully'
      ),
      [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
        createErrorSchema(updateRoleBodySchema),
        'Unprocessable Entity'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(zodResponseSchema(), 'Role not found'),
      [HttpStatusCodes.CONFLICT]: jsonContent(zodResponseSchema(), 'Role name already exists'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(zodResponseSchema(), 'Forbidden'),
    },
  }),

  delete: createRoute({
    path: '/admin/roles/{id}',
    method: 'delete',
    tags: [TAGS.role],
    middleware: [isAuthenticated],
    summary: 'Delete a role',
    request: {
      params: z.object({
        id: z.string().describe('Role ID'),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(z.object({ success: z.boolean() })),
        'Role deleted successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(zodResponseSchema(), 'Role not found'),
      [HttpStatusCodes.BAD_REQUEST]: jsonContent(
        zodResponseSchema(),
        'Cannot delete role assigned to team members'
      ),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(zodResponseSchema(), 'Forbidden'),
    },
  }),

  assignPermissions: createRoute({
    path: '/admin/roles/{id}/permissions',
    method: 'post',
    tags: [TAGS.role],
    middleware: [isAuthenticated],
    summary: 'Assign permissions to a role',
    request: {
      params: z.object({
        id: z.string().describe('Role ID'),
      }),
      body: jsonContentRequired(
        assignPermissionsBodySchema,
        'Request body for assigning permissions'
      ),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(roleResponseSchema),
        'Permissions assigned successfully'
      ),
      [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
        createErrorSchema(assignPermissionsBodySchema),
        'Unprocessable Entity'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(zodResponseSchema(), 'Role or permission not found'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(zodResponseSchema(), 'Forbidden'),
    },
  }),
}


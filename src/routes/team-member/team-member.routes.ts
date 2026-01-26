import { createRoute, z } from '@hono/zod-openapi'
import * as HttpStatusCodes from 'stoker/http-status-codes'
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers'
import { createErrorSchema } from 'stoker/openapi/schemas'
import TAGS from '~/config/tags'
import { zodResponseSchema } from '~/lib/zod-helper'
import { isAuthenticated } from '~/middleware/is-authenticated'

const teamMemberResponseSchema = z
  .object({
    id: z.string(),
    userId: z.string(),
    user: z.object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
      image: z.string().nullable(),
      role: z.string().nullable(),
      createdAt: z.string().datetime(),
    }),
    role: z.object({
      id: z.string(),
      name: z.string(),
      description: z.string().nullable(),
      permissions: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          slug: z.string(),
        })
      ),
    }),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .describe('Team member with role and permissions')

const teamMemberListResponseSchema = z
  .object({
    teamMembers: z.array(teamMemberResponseSchema),
  })
  .describe('List of team members')

const createTeamMemberBodySchema = z
  .object({
    name: z.string().min(1).describe('Team member name'),
    email: z.string().email().describe('Team member email'),
    password: z.string().min(8).describe('Team member password (minimum 8 characters)'),
    roleId: z.string().describe('Role ID to assign to the team member'),
  })
  .describe('Request body for creating a team member')

const updateTeamMemberRoleBodySchema = z
  .object({
    roleId: z.string().describe('New role ID to assign'),
  })
  .describe('Request body for updating team member role')

export const TEAM_MEMBER_ROUTES = {
  getAll: createRoute({
    path: '/admin/team-members',
    method: 'get',
    tags: [TAGS.teamMember],
    middleware: [isAuthenticated],
    summary: 'Get all team members with their roles and permissions',
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(teamMemberListResponseSchema),
        'Team members retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(zodResponseSchema(), 'Forbidden'),
    },
  }),

  getByUserId: createRoute({
    path: '/admin/team-members/{userId}',
    method: 'get',
    tags: [TAGS.teamMember],
    middleware: [isAuthenticated],
    summary: 'Get team member by user ID',
    request: {
      params: z.object({
        userId: z.string().describe('User ID'),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(teamMemberResponseSchema),
        'Team member retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(zodResponseSchema(), 'Team member not found'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(zodResponseSchema(), 'Forbidden'),
    },
  }),

  create: createRoute({
    path: '/admin/team-members',
    method: 'post',
    tags: [TAGS.teamMember],
    middleware: [isAuthenticated],
    summary: 'Add a new team member (creates user and assigns role)',
    request: {
      body: jsonContentRequired(
        createTeamMemberBodySchema,
        'Request body for creating a team member'
      ),
    },
    responses: {
      [HttpStatusCodes.CREATED]: jsonContent(
        zodResponseSchema(teamMemberResponseSchema),
        'Team member created successfully'
      ),
      [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
        createErrorSchema(createTeamMemberBodySchema),
        'Unprocessable Entity'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.CONFLICT]: jsonContent(zodResponseSchema(), 'User with email already exists'),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(zodResponseSchema(), 'Role not found'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(zodResponseSchema(), 'Forbidden'),
    },
  }),

  updateRole: createRoute({
    path: '/admin/team-members/{userId}/role',
    method: 'patch',
    tags: [TAGS.teamMember],
    middleware: [isAuthenticated],
    summary: 'Update team member role',
    request: {
      params: z.object({
        userId: z.string().describe('User ID'),
      }),
      body: jsonContentRequired(
        updateTeamMemberRoleBodySchema,
        'Request body for updating team member role'
      ),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(teamMemberResponseSchema),
        'Team member role updated successfully'
      ),
      [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
        createErrorSchema(updateTeamMemberRoleBodySchema),
        'Unprocessable Entity'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(
        zodResponseSchema(),
        'Team member or role not found'
      ),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(zodResponseSchema(), 'Forbidden'),
    },
  }),

  delete: createRoute({
    path: '/admin/team-members/{userId}',
    method: 'delete',
    tags: [TAGS.teamMember],
    middleware: [isAuthenticated],
    summary: 'Remove team member (removes from team but keeps user account)',
    request: {
      params: z.object({
        userId: z.string().describe('User ID'),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(z.object({ success: z.boolean() })),
        'Team member removed successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(zodResponseSchema(), 'Team member not found'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(zodResponseSchema(), 'Forbidden'),
    },
  }),
}


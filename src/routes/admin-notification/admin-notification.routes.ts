import { createRoute, z } from '@hono/zod-openapi'
import * as HttpStatusCodes from 'stoker/http-status-codes'
import { jsonContent } from 'stoker/openapi/helpers'
import TAGS from '~/config/tags'
import { zodResponseSchema } from '~/lib/zod-helper'

const notificationResponseSchema = z
  .object({
    id: z.string(),
    userId: z.string(),
    title: z.string().describe('Notification type (used for icons)'),
    url: z.string().nullable().describe('URL for redirection'),
    message: z.string(),
    isRead: z.boolean(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .describe('Notification information')

const adminNotificationListResponseSchema = z
  .object({
    notifications: z.array(notificationResponseSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
  })
  .describe('Admin notifications list')

export const ADMIN_NOTIFICATION_ROUTES = {
  getAll: createRoute({
    path: '/admin/notifications',
    method: 'get',
    tags: [TAGS.notification],
    summary: 'Get admin notifications (permission-filtered for team members)',
    request: {
      query: z.object({
        page: z.string().optional().describe('Page number (default: 1)'),
        limit: z.string().optional().describe('Items per page (default: 10)'),
        isRead: z.string().optional().describe('Filter by read status (true/false), omit for all'),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(adminNotificationListResponseSchema),
        'Admin notifications retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.FORBIDDEN]: jsonContent(zodResponseSchema(), 'Forbidden - Admin only'),
    },
  }),
}

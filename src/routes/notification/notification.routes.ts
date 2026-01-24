import { createRoute, z } from '@hono/zod-openapi'
import * as HttpStatusCodes from 'stoker/http-status-codes'
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers'
import { createErrorSchema } from 'stoker/openapi/schemas'
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

const notificationListResponseSchema = z
  .object({
    notifications: z.array(notificationResponseSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
    unreadCount: z.number().int(),
  })
  .describe('List of notifications with pagination and unread count')

const markAsReadBodySchema = z
  .object({
    notificationId: z.string().describe('Notification ID to mark as read'),
  })
  .describe('Request body for marking a notification as read')

export const NOTIFICATION_ROUTES = {
  getAll: createRoute({
    path: '/notifications',
    method: 'get',
    tags: [TAGS.notification],
    summary: 'Get all notifications for authenticated user',
    request: {
      query: z.object({
        page: z.string().optional().describe('Page number (default: 1)'),
        limit: z.string().optional().describe('Items per page (default: 10)'),
        isRead: z.string().optional().describe('Filter by read status (true/false), omit for all'),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(notificationListResponseSchema),
        'Notifications retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
    },
  }),

  markAsRead: createRoute({
    path: '/notifications/mark-read',
    method: 'post',
    tags: [TAGS.notification],
    summary: 'Mark a notification as read',
    request: {
      body: jsonContentRequired(
        markAsReadBodySchema,
        'Request body for marking notification as read'
      ),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(),
        'Notification marked as read successfully'
      ),
      [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
        createErrorSchema(markAsReadBodySchema),
        'Unprocessable Entity'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(zodResponseSchema(), 'Notification not found'),
    },
  }),

  markAllAsRead: createRoute({
    path: '/notifications/mark-all-read',
    method: 'post',
    tags: [TAGS.notification],
    summary: 'Mark all notifications as read for authenticated user',
    request: {},
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(),
        'All notifications marked as read successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
    },
  }),

  delete: createRoute({
    path: '/notifications/{id}',
    method: 'delete',
    tags: [TAGS.notification],
    summary: 'Delete a notification',
    request: {
      params: z.object({
        id: z.string().describe('Notification ID'),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(zodResponseSchema(), 'Notification deleted successfully'),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
      [HttpStatusCodes.NOT_FOUND]: jsonContent(zodResponseSchema(), 'Notification not found'),
    },
  }),

  getUnreadCount: createRoute({
    path: '/notifications/unread-count',
    method: 'get',
    tags: [TAGS.notification],
    summary: 'Get unread notification count for authenticated user',
    request: {},
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        zodResponseSchema(
          z.object({
            unreadCount: z.number().int(),
          })
        ),
        'Unread count retrieved successfully'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(zodResponseSchema(), 'Unauthorized'),
    },
  }),
}

import * as HttpStatusCodes from 'stoker/http-status-codes'
import { HttpError } from '~/lib/error'
import type { NOTIFICATION_ROUTES } from '~/routes/notification/notification.routes'
import { NOTIFICATION_SERVICES } from '~/services/notification.service'
import type { HandlerMapFromRoutes } from '~/types'

const formatNotificationResponse = (notification: {
  id: string
  userId: string
  title: string
  url: string | null
  message: string
  isRead: boolean
  createdAt: Date
  updatedAt: Date
}) => ({
  id: notification.id,
  userId: notification.userId,
  title: notification.title,
  url: notification.url,
  message: notification.message,
  isRead: notification.isRead,
  createdAt: notification.createdAt.toISOString(),
  updatedAt: notification.updatedAt.toISOString(),
})

export const NOTIFICATION_ROUTES_HANDLER: HandlerMapFromRoutes<typeof NOTIFICATION_ROUTES> = {
  getAll: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    const query = c.req.valid('query')
    const filters = {
      userId: user.id,
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 10,
      isRead: query.isRead === undefined ? undefined : query.isRead === 'true',
    }

    const result = await NOTIFICATION_SERVICES.getAll(filters)

    return c.json(
      {
        message: 'Notifications retrieved successfully',
        success: true,
        data: {
          notifications: result.notifications.map(formatNotificationResponse),
          pagination: result.pagination,
          unreadCount: result.unreadCount,
        },
      },
      HttpStatusCodes.OK
    )
  },

  markAsRead: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    const { notificationId } = c.req.valid('json')

    try {
      const result = await NOTIFICATION_SERVICES.markAsRead(notificationId, user.id)

      if (result.count === 0) {
        throw new HttpError('Notification not found', HttpStatusCodes.NOT_FOUND)
      }

      return c.json(
        {
          message: 'Notification marked as read successfully',
          success: true,
        },
        HttpStatusCodes.OK
      )
    } catch (error: unknown) {
      if (error instanceof HttpError) {
        throw error
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new HttpError(
        errorMessage || 'Failed to mark notification as read',
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  markAllAsRead: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    try {
      await NOTIFICATION_SERVICES.markAllAsRead(user.id)

      return c.json(
        {
          message: 'All notifications marked as read successfully',
          success: true,
        },
        HttpStatusCodes.OK
      )
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new HttpError(
        errorMessage || 'Failed to mark all notifications as read',
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  delete: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    const { id } = c.req.valid('params')

    try {
      const result = await NOTIFICATION_SERVICES.delete(id, user.id)

      if (result.count === 0) {
        throw new HttpError('Notification not found', HttpStatusCodes.NOT_FOUND)
      }

      return c.json(
        {
          message: 'Notification deleted successfully',
          success: true,
        },
        HttpStatusCodes.OK
      )
    } catch (error: unknown) {
      if (error instanceof HttpError) {
        throw error
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new HttpError(
        errorMessage || 'Failed to delete notification',
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  getUnreadCount: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    try {
      const unreadCount = await NOTIFICATION_SERVICES.getUnreadCount(user.id)

      return c.json(
        {
          message: 'Unread count retrieved successfully',
          success: true,
          data: {
            unreadCount,
          },
        },
        HttpStatusCodes.OK
      )
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new HttpError(
        errorMessage || 'Failed to get unread count',
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },
}


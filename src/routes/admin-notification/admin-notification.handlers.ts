import * as HttpStatusCodes from 'stoker/http-status-codes'
import { HttpError } from '~/lib/error'
import { getUserPermissions, PERMISSION_SLUGS, requirePermission } from '~/lib/permission-check'
import type { ADMIN_NOTIFICATION_ROUTES } from '~/routes/admin-notification/admin-notification.routes'
import { NOTIFICATION_SERVICES, NOTIFICATION_TYPES } from '~/services/notification.service'
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

/**
 * Map notification types to the permission slug required to see them in admin panel
 * (used only when viewer has `notifications.view_by_permission` and NOT `notifications.view_all`)
 */
const NOTIFICATION_TYPE_TO_PERMISSION: Partial<Record<string, string>> = {
  [NOTIFICATION_TYPES.DOCTOR_ONBOARDING_REQUEST]: PERMISSION_SLUGS.SPECIALISTS_VIEW,
  [NOTIFICATION_TYPES.USER_INQUIRY]: PERMISSION_SLUGS.USER_INQUIRIES_VIEW,
  [NOTIFICATION_TYPES.APPOINTMENT_BOOKED]: PERMISSION_SLUGS.SESSIONS_VIEW,
  [NOTIFICATION_TYPES.APPOINTMENT_COMPLETED]: PERMISSION_SLUGS.SESSIONS_VIEW,
  [NOTIFICATION_TYPES.APPOINTMENT_NO_SHOW]: PERMISSION_SLUGS.SESSIONS_VIEW,
  // Message notifications are not part of admin panel by default
}

export const ADMIN_NOTIFICATION_ROUTES_HANDLER: HandlerMapFromRoutes<
  typeof ADMIN_NOTIFICATION_ROUTES
> = {
  getAll: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only admins/team admins can view admin notifications
    if (user.role !== 'admin' && user.role !== 'team_admin') {
      throw new HttpError('Forbidden - Admin only', HttpStatusCodes.FORBIDDEN)
    }

    // Always filter notifications by permission, even if user has view_all
    await requirePermission(user.id, PERMISSION_SLUGS.NOTIFICATIONS_VIEW_BY_PERMISSION)
    const permissionSlugs = await getUserPermissions(user.id)
    const allowedTypes = Object.entries(NOTIFICATION_TYPE_TO_PERMISSION)
      .filter(
        ([, requiredPermission]) =>
          requiredPermission && permissionSlugs.includes(requiredPermission)
      )
      .map(([type]) => type)

    const query = c.req.valid('query')
    const filters = {
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 10,
      isRead: query.isRead === undefined ? undefined : query.isRead === 'true',
      allowedTypes,
    }

    const result = await NOTIFICATION_SERVICES.getAllForAdmin(filters)

    return c.json(
      {
        message: 'Admin notifications retrieved successfully',
        success: true,
        data: {
          notifications: result.notifications.map(formatNotificationResponse),
          pagination: result.pagination,
        },
      },
      HttpStatusCodes.OK
    )
  },
}

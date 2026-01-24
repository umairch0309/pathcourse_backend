import {
  NOTIFICATION_SERVICES,
  NOTIFICATION_TYPES,
  type NotificationType,
} from '~/services/notification.service'

// Re-export NOTIFICATION_TYPES for convenience
export { NOTIFICATION_TYPES }

const FRONTEND_URL = Bun.env.FRONTEND_URL || 'https://pathcourse.hasseebmayo.com'

/**
 * Build notification URL based on type and related entity ID
 */
export function buildNotificationUrl(type: string, entityId?: string): string | null {
  switch (type) {
    case NOTIFICATION_TYPES.DOCTOR_ONBOARDING_REQUEST:
      return `${FRONTEND_URL}/admin/specialists`
    case NOTIFICATION_TYPES.DOCTOR_APPROVED:
    case NOTIFICATION_TYPES.DOCTOR_REJECTED:
      return `${FRONTEND_URL}/specialist`
    case NOTIFICATION_TYPES.APPOINTMENT_BOOKED:
    case NOTIFICATION_TYPES.APPOINTMENT_NO_SHOW:
    case NOTIFICATION_TYPES.APPOINTMENT_COMPLETED:
      if (!entityId) {
        return null
      }
      return `${FRONTEND_URL}/admin/sessions/${entityId}`
    case NOTIFICATION_TYPES.USER_INQUIRY:
      if (!entityId) {
        return null
      }
      return `${FRONTEND_URL}/admin/user-inquiries/${entityId}`
    default:
      return null
  }
}

/**
 * Get all admin user IDs
 */
export async function getAllAdminUserIds(): Promise<string[]> {
  const prisma = (await import('~/lib/prisma')).default
  const admins = await prisma.user.findMany({
    where: {
      role: 'admin',
    },
    select: {
      id: true,
    },
  })
  return admins.map((admin: { id: string }) => admin.id)
}

/**
 * Create notification for a single user
 */
export async function createNotificationForUser(
  userId: string,
  type: NotificationType,
  message: string,
  entityId?: string
) {
  const url = buildNotificationUrl(type, entityId)
  await NOTIFICATION_SERVICES.create({
    userId,
    title: type,
    message,
    url,
  })
}

/**
 * Create notifications for multiple users
 */
export async function createNotificationsForUsers(
  userIds: string[],
  type: NotificationType,
  message: string,
  entityId?: string
) {
  const url = buildNotificationUrl(type, entityId)
  await Promise.all(
    userIds.map(userId =>
      NOTIFICATION_SERVICES.create({
        userId,
        title: type,
        message,
        url,
      })
    )
  )
}

/**
 * Create notification for all admins
 */
export async function createNotificationForAllAdmins(
  type: NotificationType,
  message: string,
  entityId?: string
) {
  const adminIds = await getAllAdminUserIds()
  if (adminIds.length > 0) {
    await createNotificationsForUsers(adminIds, type, message, entityId)
  }
}

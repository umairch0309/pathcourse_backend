import prisma from '~/lib/prisma'

// Notification types for title field (used for icons)
export const NOTIFICATION_TYPES = {
  DOCTOR_ONBOARDING_REQUEST: 'DOCTOR_ONBOARDING_REQUEST',
  DOCTOR_APPROVED: 'DOCTOR_APPROVED',
  DOCTOR_REJECTED: 'DOCTOR_REJECTED',
  APPOINTMENT_BOOKED: 'APPOINTMENT_BOOKED',
  APPOINTMENT_NO_SHOW: 'APPOINTMENT_NO_SHOW',
  APPOINTMENT_COMPLETED: 'APPOINTMENT_COMPLETED',
  USER_INQUIRY: 'USER_INQUIRY',
} as const

export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES]

export const NOTIFICATION_SERVICES = {
  // Create a notification
  create: async (data: {
    userId: string
    title: NotificationType
    message: string
    url?: string | null
  }) => {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        url: data.url || null,
      },
    })
    return notification
  },

  // Get all notifications for a user
  getAll: async (filters?: {
    userId: string
    page?: number
    limit?: number
    isRead?: boolean | null
  }) => {
    const page = filters?.page || 1
    const limit = filters?.limit || 10
    const skip = (page - 1) * limit

    if (!filters?.userId) {
      throw new Error('UserId is required')
    }

    const where: {
      userId: string
      isRead?: boolean
    } = {
      userId: filters.userId,
    }

    if (filters?.isRead !== null && filters?.isRead !== undefined) {
      where.isRead = filters.isRead
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: {
          userId: filters.userId,
          isRead: false,
        },
      }),
    ])

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      unreadCount,
    }
  },

  // Get notification by ID
  getById: async (id: string, userId: string) => {
    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId,
      },
    })
    return notification
  },

  // Mark notification as read
  markAsRead: async (id: string, userId: string) => {
    const notification = await prisma.notification.updateMany({
      where: {
        id,
        userId,
      },
      data: {
        isRead: true,
      },
    })
    return notification
  },

  // Mark all notifications as read for a user
  markAllAsRead: async (userId: string) => {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    })
    return result
  },

  // Delete notification
  delete: async (id: string, userId: string) => {
    const notification = await prisma.notification.deleteMany({
      where: {
        id,
        userId,
      },
    })
    return notification
  },

  // Get unread count for a user
  getUnreadCount: async (userId: string) => {
    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    })
    return count
  },
}

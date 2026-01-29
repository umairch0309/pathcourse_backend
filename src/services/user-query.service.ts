/** biome-ignore-all lint/suspicious/noExplicitAny: complex Prisma query types with dynamic includes */
import prisma from '~/lib/prisma'

export const USER_QUERY_SERVICES = {
  create: async (data: {
    message: string
    organizationName: string
    organizationEmail: string
    name?: string | null
    number?: string | null
    email?: string | null
    userId?: string | null
  }) => {
    const userQuery = await prisma.userQuery.create({
      data: {
        message: data.message,
        organizationName: data.organizationName,
        organizationEmail: data.organizationEmail,
        name: data.name || '',
        number: data.number || '',
        email: data.email || '',
        userId: data.userId || null,
      },
    })

    // Create notification for all admins and team members
    // createNotificationForAllAdmins now notifies all admins and team members
    const { createNotificationForAllAdmins, NOTIFICATION_TYPES } = await import(
      '~/lib/notification-helper'
    )
    await createNotificationForAllAdmins(
      NOTIFICATION_TYPES.USER_INQUIRY,
      `New user inquiry from ${data.organizationName} (${data.organizationEmail})`,
      userQuery.id
    )

    return userQuery
  },

  getAll: async (filters?: { page?: number; limit?: number; search?: string }) => {
    const page = filters?.page || 1
    const limit = filters?.limit || 10
    const skip = (page - 1) * limit

    const where: any = {}
    if (filters?.search) {
      where.OR = [
        { organizationName: { contains: filters.search, mode: 'insensitive' } },
        { organizationEmail: { contains: filters.search, mode: 'insensitive' } },
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { number: { contains: filters.search, mode: 'insensitive' } },
        { message: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const [userQueries, total] = await Promise.all([
      prisma.userQuery.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.userQuery.count({ where }),
    ])

    return {
      userQueries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  },

  getById: async (id: string) => {
    const userQuery = await prisma.userQuery.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
    return userQuery
  },

  delete: async (id: string) => {
    const userQuery = await prisma.userQuery.delete({
      where: { id },
    })
    return userQuery
  },

  // Get last N user queries
  getLastN: async (limit: number = 5) => {
    const userQueries = await prisma.userQuery.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return userQueries
  },
}

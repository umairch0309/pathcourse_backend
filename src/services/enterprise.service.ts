import prisma from '~/lib/prisma'
import { generateUniqueEnterpriseCode } from '~/lib/generate-enterprise-code'

export const ENTERPRISE_SERVICES = {
  getByCode: async (code: string) => {
    const enterprise = await prisma.enterprise.findUnique({
      where: { code },
    })
    return enterprise
  },

  create: async (data: {
    name: string
    code?: string
    sessionsPerMonth: number
    generateCode?: boolean
  }) => {
    // Check for unique enterprise name
    const existingByName = await prisma.enterprise.findFirst({
      where: {
        name: {
          equals: data.name,
          mode: 'insensitive',
        },
      },
    })
    if (existingByName) {
      throw new Error('Enterprise name already exists')
    }

    let code: string = data.code || ''

    // If generateCode is true or code is not provided, generate code from name
    if (data.generateCode || !code) {
      code = await generateUniqueEnterpriseCode(data.name)
    }

    // Validate code uniqueness if provided manually
    if (code && !data.generateCode) {
      const existing = await prisma.enterprise.findUnique({
        where: { code },
      })
      if (existing) {
        throw new Error('Enterprise code already exists')
      }
    }

    // At this point, code is guaranteed to be defined
    if (!code) {
      throw new Error('Enterprise code is required')
    }

    const enterprise = await prisma.enterprise.create({
      data: {
        name: data.name,
        code,
        sessionsPerMonth: data.sessionsPerMonth,
      },
    })
    return enterprise
  },

  getAll: async (filters?: { page?: number; limit?: number; search?: string }) => {
    const page = filters?.page || 1
    const limit = filters?.limit || 10
    const skip = (page - 1) * limit

    const where = filters?.search
      ? {
          OR: [
            { name: { contains: filters.search, mode: 'insensitive' as const } },
            { code: { contains: filters.search, mode: 'insensitive' as const } },
          ],
        }
      : {}

    const [enterprises, total] = await Promise.all([
      prisma.enterprise.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.enterprise.count({ where }),
    ])

    return {
      enterprises,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  },

  getById: async (id: string) => {
    const enterprise = await prisma.enterprise.findUnique({
      where: { id },
    })
    return enterprise
  },

  update: async (
    id: string,
    data: { name?: string; code?: string; sessionsPerMonth?: number }
  ) => {
    // If updating name, check uniqueness
    if (data.name) {
      const existingByName = await prisma.enterprise.findFirst({
        where: {
          name: {
            equals: data.name,
            mode: 'insensitive',
          },
          NOT: { id },
        },
      })
      if (existingByName) {
        throw new Error('Enterprise name already exists')
      }
    }

    // If updating code, check uniqueness
    if (data.code) {
      const existing = await prisma.enterprise.findFirst({
        where: {
          code: data.code,
          NOT: { id },
        },
      })
      if (existing) {
        throw new Error('Enterprise code already exists')
      }
    }

    const enterprise = await prisma.enterprise.update({
      where: { id },
      data,
    })
    return enterprise
  },

  delete: async (id: string) => {
    await prisma.enterprise.delete({
      where: { id },
    })
  },
}



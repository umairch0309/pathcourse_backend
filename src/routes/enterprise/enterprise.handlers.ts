import * as HttpStatusCodes from 'stoker/http-status-codes'
import { HttpError } from '~/lib/error'
import type { ENTERPRISE_ROUTES } from '~/routes/enterprise/enterprise.routes'
import { ENTERPRISE_SERVICES } from '~/services/enterprise.service'
import type { HandlerMapFromRoutes } from '~/types'

const formatEnterpriseResponse = (enterprise: {
  id: string
  name: string
  code: string
  sessionsPerMonth: number
  createdAt: Date
  updatedAt: Date
}) => ({
  id: enterprise.id,
  name: enterprise.name,
  code: enterprise.code,
  sessionsPerMonth: enterprise.sessionsPerMonth,
  createdAt: enterprise.createdAt.toISOString(),
  updatedAt: enterprise.updatedAt.toISOString(),
})

export const ENTERPRISE_ROUTES_HANDLER: HandlerMapFromRoutes<typeof ENTERPRISE_ROUTES> = {
  create: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only admins can create enterprises
    if (user.role !== 'admin') {
      throw new HttpError('Forbidden - Admin only', HttpStatusCodes.FORBIDDEN)
    }

    const { name, code, sessionsPerMonth, generateCode } = c.req.valid('json')

    try {
      const enterprise = await ENTERPRISE_SERVICES.create({
        name,
        code: code || undefined,
        sessionsPerMonth,
        generateCode: generateCode || false,
      })

      return c.json(
        {
          message: 'Enterprise created successfully',
          success: true,
          data: formatEnterpriseResponse(enterprise),
        },
        HttpStatusCodes.CREATED
      )
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      if (errorMessage.includes('name already exists')) {
        throw new HttpError('Enterprise name already exists', HttpStatusCodes.BAD_REQUEST)
      }
      if (errorMessage.includes('code already exists')) {
        throw new HttpError('Enterprise code already exists', HttpStatusCodes.BAD_REQUEST)
      }
      throw new HttpError(
        errorMessage || 'Failed to create enterprise',
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  getAll: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only admins can view all enterprises
    if (user.role !== 'admin') {
      throw new HttpError('Forbidden - Admin only', HttpStatusCodes.FORBIDDEN)
    }

    const query = c.req.valid('query')
    const filters = {
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 10,
      search: query.search,
    }

    const result = await ENTERPRISE_SERVICES.getAll(filters)

    return c.json(
      {
        message: 'Enterprises retrieved successfully',
        success: true,
        data: {
          enterprises: result.enterprises.map(formatEnterpriseResponse),
          pagination: result.pagination,
        },
      },
      HttpStatusCodes.OK
    )
  },

  getById: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only admins can view enterprise by ID
    if (user.role !== 'admin') {
      throw new HttpError('Forbidden - Admin only', HttpStatusCodes.FORBIDDEN)
    }

    const { id } = c.req.valid('param')

    const enterprise = await ENTERPRISE_SERVICES.getById(id)

    if (!enterprise) {
      throw new HttpError('Enterprise not found', HttpStatusCodes.NOT_FOUND)
    }

    return c.json(
      {
        message: 'Enterprise retrieved successfully',
        success: true,
        data: formatEnterpriseResponse(enterprise),
      },
      HttpStatusCodes.OK
    )
  },

  update: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only admins can update enterprises
    if (user.role !== 'admin') {
      throw new HttpError('Forbidden - Admin only', HttpStatusCodes.FORBIDDEN)
    }

    const { id } = c.req.valid('param')
    const body = c.req.valid('json')

    try {
      const enterprise = await ENTERPRISE_SERVICES.update(id, {
        name: body.name,
        code: body.code,
        sessionsPerMonth: body.sessionsPerMonth,
      })

      return c.json(
        {
          message: 'Enterprise updated successfully',
          success: true,
          data: formatEnterpriseResponse(enterprise),
        },
        HttpStatusCodes.OK
      )
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      if (errorMessage.includes('name already exists')) {
        throw new HttpError('Enterprise name already exists', HttpStatusCodes.BAD_REQUEST)
      }
      if (errorMessage.includes('code already exists')) {
        throw new HttpError('Enterprise code already exists', HttpStatusCodes.BAD_REQUEST)
      }
      if (errorMessage.includes('not found') || errorMessage.includes('P2025')) {
        throw new HttpError('Enterprise not found', HttpStatusCodes.NOT_FOUND)
      }
      throw new HttpError(
        errorMessage || 'Failed to update enterprise',
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  delete: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only admins can delete enterprises
    if (user.role !== 'admin') {
      throw new HttpError('Forbidden - Admin only', HttpStatusCodes.FORBIDDEN)
    }

    const { id } = c.req.valid('param')

    try {
      await ENTERPRISE_SERVICES.delete(id)

      return c.json(
        {
          message: 'Enterprise deleted successfully',
          success: true,
        },
        HttpStatusCodes.OK
      )
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      if (errorMessage.includes('not found') || errorMessage.includes('P2025')) {
        throw new HttpError('Enterprise not found', HttpStatusCodes.NOT_FOUND)
      }
      throw new HttpError(
        errorMessage || 'Failed to delete enterprise',
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },
}


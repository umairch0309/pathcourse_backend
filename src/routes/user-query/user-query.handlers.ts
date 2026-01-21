import type { Prisma } from '@prisma/client'
import * as HttpStatusCodes from 'stoker/http-status-codes'

import { HttpError } from '~/lib/error'
import type { USER_QUERY_ROUTES } from '~/routes/user-query/user-query.routes'
import { USER_QUERY_SERVICES } from '~/services/user-query.service'
import type { HandlerMapFromRoutes } from '~/types'

type UserQueryWithUser = Prisma.UserQueryGetPayload<{
  include: {
    user: true
  }
}>

const formatUserQueryResponse = (query: UserQueryWithUser) => ({
  id: query.id,
  message: query.message,
  name: query.name,
  number: query.number,
  email: query.email,
  userId: query.userId,
  createdAt: query.createdAt.toISOString(),
  updatedAt: query.updatedAt.toISOString(),
  user: query.user
    ? {
        id: query.user.id,
        name: query.user.name,
        email: query.user.email,
      }
    : null,
})

export const USER_QUERY_ROUTES_HANDLER: HandlerMapFromRoutes<typeof USER_QUERY_ROUTES> = {
  create: async c => {
    // Public endpoint - no authentication required
    const user = c.get('user') // Optional - if user is logged in, we'll associate the query

    const { message, name, number, email } = c.req.valid('json')

    const userQuery = await USER_QUERY_SERVICES.create({
      message,
      name,
      number,
      email,
      userId: user?.id || null,
    })

    return c.json(
      {
        message: 'User query created successfully',
        success: true,
        data: formatUserQueryResponse(userQuery),
      },
      HttpStatusCodes.CREATED
    )
  },

  getAll: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only admins can view all queries
    if (user.role !== 'admin') {
      throw new HttpError('Forbidden - Admin only', HttpStatusCodes.FORBIDDEN)
    }

    const query = c.req.valid('query')
    const filters = {
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 10,
      search: query.search,
    }

    const result = await USER_QUERY_SERVICES.getAll(filters)

    return c.json(
      {
        message: 'User queries retrieved successfully',
        success: true,
        data: {
          userQueries: result.userQueries.map(formatUserQueryResponse),
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

    // Only admins can view queries by ID
    if (user.role !== 'admin') {
      throw new HttpError('Forbidden - Admin only', HttpStatusCodes.FORBIDDEN)
    }

    const { id } = c.req.valid('param')

    const userQuery = await USER_QUERY_SERVICES.getById(id)

    if (!userQuery) {
      throw new HttpError('User query not found', HttpStatusCodes.NOT_FOUND)
    }

    return c.json(
      {
        message: 'User query retrieved successfully',
        success: true,
        data: formatUserQueryResponse(userQuery),
      },
      HttpStatusCodes.OK
    )
  },

  delete: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only admins can delete queries
    if (user.role !== 'admin') {
      throw new HttpError('Forbidden - Admin only', HttpStatusCodes.FORBIDDEN)
    }

    const { id } = c.req.valid('param')

    try {
      await USER_QUERY_SERVICES.delete(id)

      return c.json(
        {
          message: 'User query deleted successfully',
          success: true,
        },
        HttpStatusCodes.OK
      )
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error && error.code === 'P2025') {
        throw new HttpError('User query not found', HttpStatusCodes.NOT_FOUND)
      }
      throw error
    }
  },
}


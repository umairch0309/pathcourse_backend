import * as HttpStatusCodes from 'stoker/http-status-codes'
import { HttpError } from '~/lib/error'
import type { PERMISSION_ROUTES } from '~/routes/permission/permission.routes'
import { PERMISSION_SERVICES } from '~/services/permission.service'
import type { HandlerMapFromRoutes } from '~/types'

export const PERMISSION_ROUTES_HANDLER: HandlerMapFromRoutes<typeof PERMISSION_ROUTES> = {
  getAll: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only admins can view permissions
    if (user.role !== 'admin') {
      throw new HttpError('Forbidden - Admin only', HttpStatusCodes.FORBIDDEN)
    }

    try {
      const result = await PERMISSION_SERVICES.getAll()

      return c.json(
        {
          message: 'Permissions retrieved successfully',
          success: true,
          data: {
            permissions: result.permissions.map(permission => ({
              ...permission,
              createdAt: permission.createdAt.toISOString(),
              updatedAt: permission.updatedAt.toISOString(),
            })),
          },
        },
        HttpStatusCodes.OK
      )
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to retrieve permissions'
      throw new HttpError(message, HttpStatusCodes.INTERNAL_SERVER_ERROR)
    }
  },

  getById: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only admins can view permissions
    if (user.role !== 'admin') {
      throw new HttpError('Forbidden - Admin only', HttpStatusCodes.FORBIDDEN)
    }

    const { id } = c.req.valid('param')

    try {
      const permission = await PERMISSION_SERVICES.getById(id)

      return c.json(
        {
          message: 'Permission retrieved successfully',
          success: true,
          data: {
            ...permission,
            createdAt: permission.createdAt.toISOString(),
            updatedAt: permission.updatedAt.toISOString(),
          },
        },
        HttpStatusCodes.OK
      )
    } catch (error: unknown) {
      if (error instanceof HttpError) {
        throw error
      }
      const message = error instanceof Error ? error.message : 'Failed to retrieve permission'
      throw new HttpError(message, HttpStatusCodes.INTERNAL_SERVER_ERROR)
    }
  },

  create: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only admins can create permissions
    if (user.role !== 'admin') {
      throw new HttpError('Forbidden - Admin only', HttpStatusCodes.FORBIDDEN)
    }

    const body = c.req.valid('json')

    try {
      const permission = await PERMISSION_SERVICES.create(body)

      return c.json(
        {
          message: 'Permission created successfully',
          success: true,
          data: {
            ...permission,
            createdAt: permission.createdAt.toISOString(),
            updatedAt: permission.updatedAt.toISOString(),
          },
        },
        HttpStatusCodes.CREATED
      )
    } catch (error: unknown) {
      if (error instanceof HttpError) {
        throw error
      }
      const message = error instanceof Error ? error.message : 'Failed to create permission'
      throw new HttpError(message, HttpStatusCodes.INTERNAL_SERVER_ERROR)
    }
  },

  update: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only admins can update permissions
    if (user.role !== 'admin') {
      throw new HttpError('Forbidden - Admin only', HttpStatusCodes.FORBIDDEN)
    }

    const { id } = c.req.valid('param')
    const body = c.req.valid('json')

    try {
      const permission = await PERMISSION_SERVICES.update(id, body)

      return c.json(
        {
          message: 'Permission updated successfully',
          success: true,
          data: {
            ...permission,
            createdAt: permission.createdAt.toISOString(),
            updatedAt: permission.updatedAt.toISOString(),
          },
        },
        HttpStatusCodes.OK
      )
    } catch (error: unknown) {
      if (error instanceof HttpError) {
        throw error
      }
      const message = error instanceof Error ? error.message : 'Failed to update permission'
      throw new HttpError(message, HttpStatusCodes.INTERNAL_SERVER_ERROR)
    }
  },

  delete: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only admins can delete permissions
    if (user.role !== 'admin') {
      throw new HttpError('Forbidden - Admin only', HttpStatusCodes.FORBIDDEN)
    }

    const { id } = c.req.valid('param')

    try {
      await PERMISSION_SERVICES.delete(id)

      return c.json(
        {
          message: 'Permission deleted successfully',
          success: true,
          data: { success: true },
        },
        HttpStatusCodes.OK
      )
    } catch (error: unknown) {
      if (error instanceof HttpError) {
        throw error
      }
      const message = error instanceof Error ? error.message : 'Failed to delete permission'
      throw new HttpError(message, HttpStatusCodes.INTERNAL_SERVER_ERROR)
    }
  },
}

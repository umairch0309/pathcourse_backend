import * as HttpStatusCodes from 'stoker/http-status-codes'
import { HttpError } from '~/lib/error'
import type { ROLE_ROUTES } from '~/routes/role/role.routes'
import { ROLE_SERVICES } from '~/services/role.service'
import type { HandlerMapFromRoutes } from '~/types'

export const ROLE_ROUTES_HANDLER: HandlerMapFromRoutes<typeof ROLE_ROUTES> = {
  getAll: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only admins can view roles
    if (user.role !== 'admin' && user.role !== 'team_admin') {
      throw new HttpError('Forbidden - Admin only', HttpStatusCodes.FORBIDDEN)
    }

    try {
      const result = await ROLE_SERVICES.getAll()

      return c.json(
        {
          message: 'Roles retrieved successfully',
          success: true,
          data: {
            roles: result.roles.map(role => ({
              ...role,
              createdAt: role.createdAt.toISOString(),
              updatedAt: role.updatedAt.toISOString(),
            })),
          },
        },
        HttpStatusCodes.OK
      )
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to retrieve roles'
      throw new HttpError(message, HttpStatusCodes.INTERNAL_SERVER_ERROR)
    }
  },

  getById: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only admins can view roles
    if (user.role !== 'admin' && user.role !== 'team_admin') {
      throw new HttpError('Forbidden - Admin only', HttpStatusCodes.FORBIDDEN)
    }

    const { id } = c.req.valid('param')

    try {
      const role = await ROLE_SERVICES.getById(id)

      return c.json(
        {
          message: 'Role retrieved successfully',
          success: true,
          data: {
            ...role,
            createdAt: role.createdAt.toISOString(),
            updatedAt: role.updatedAt.toISOString(),
          },
        },
        HttpStatusCodes.OK
      )
    } catch (error: unknown) {
      if (error instanceof HttpError) {
        throw error
      }
      const message = error instanceof Error ? error.message : 'Failed to retrieve role'
      throw new HttpError(message, HttpStatusCodes.INTERNAL_SERVER_ERROR)
    }
  },

  create: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only admins can create roles
    if (user.role !== 'admin' && user.role !== 'team_admin') {
      throw new HttpError('Forbidden - Admin only', HttpStatusCodes.FORBIDDEN)
    }

    const body = c.req.valid('json')

    try {
      const role = await ROLE_SERVICES.create(body)

      return c.json(
        {
          message: 'Role created successfully',
          success: true,
          data: {
            id: role.id,
            name: role.name,
            description: role.description,
            createdAt: role.createdAt.toISOString(),
            updatedAt: role.updatedAt.toISOString(),
          },
        },
        HttpStatusCodes.CREATED
      )
    } catch (error: unknown) {
      if (error instanceof HttpError) {
        throw error
      }
      const message = error instanceof Error ? error.message : 'Failed to create role'
      throw new HttpError(message, HttpStatusCodes.INTERNAL_SERVER_ERROR)
    }
  },

  update: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only admins can update roles
    if (user.role !== 'admin' && user.role !== 'team_admin') {
      throw new HttpError('Forbidden - Admin only', HttpStatusCodes.FORBIDDEN)
    }

    const { id } = c.req.valid('param')
    const body = c.req.valid('json')

    try {
      const role = await ROLE_SERVICES.update(id, body)

      return c.json(
        {
          message: 'Role updated successfully',
          success: true,
          data: {
            id: role.id,
            name: role.name,
            description: role.description,
            createdAt: role.createdAt.toISOString(),
            updatedAt: role.updatedAt.toISOString(),
          },
        },
        HttpStatusCodes.OK
      )
    } catch (error: unknown) {
      if (error instanceof HttpError) {
        throw error
      }
      const message = error instanceof Error ? error.message : 'Failed to update role'
      throw new HttpError(message, HttpStatusCodes.INTERNAL_SERVER_ERROR)
    }
  },

  delete: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only admins can delete roles
    if (user.role !== 'admin' && user.role !== 'team_admin') {
      throw new HttpError('Forbidden - Admin only', HttpStatusCodes.FORBIDDEN)
    }

    const { id } = c.req.valid('param')

    try {
      await ROLE_SERVICES.delete(id)

      return c.json(
        {
          message: 'Role deleted successfully',
          success: true,
          data: { success: true },
        },
        HttpStatusCodes.OK
      )
    } catch (error: unknown) {
      if (error instanceof HttpError) {
        throw error
      }
      const message = error instanceof Error ? error.message : 'Failed to delete role'
      throw new HttpError(message, HttpStatusCodes.INTERNAL_SERVER_ERROR)
    }
  },

  assignPermissions: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only admins can assign permissions
    if (user.role !== 'admin' && user.role !== 'team_admin') {
      throw new HttpError('Forbidden - Admin only', HttpStatusCodes.FORBIDDEN)
    }

    const { id } = c.req.valid('param')
    const { permissionIds } = c.req.valid('json')

    try {
      const role = await ROLE_SERVICES.assignPermissions(id, permissionIds)

      return c.json(
        {
          message: 'Permissions assigned successfully',
          success: true,
          data: {
            ...role,
            createdAt: role.createdAt.toISOString(),
            updatedAt: role.updatedAt.toISOString(),
          },
        },
        HttpStatusCodes.OK
      )
    } catch (error: unknown) {
      if (error instanceof HttpError) {
        throw error
      }
      const message = error instanceof Error ? error.message : 'Failed to assign permissions'
      throw new HttpError(message, HttpStatusCodes.INTERNAL_SERVER_ERROR)
    }
  },
}

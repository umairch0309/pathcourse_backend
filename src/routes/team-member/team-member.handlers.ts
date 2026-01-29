import * as HttpStatusCodes from 'stoker/http-status-codes'
import { HttpError } from '~/lib/error'
import type { TEAM_MEMBER_ROUTES } from '~/routes/team-member/team-member.routes'
import { TEAM_MEMBER_SERVICES } from '~/services/team-member.service'
import type { HandlerMapFromRoutes } from '~/types'

export const TEAM_MEMBER_ROUTES_HANDLER: HandlerMapFromRoutes<typeof TEAM_MEMBER_ROUTES> = {
  getAll: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only admins can view team members
    if (user.role !== 'admin' && user.role !== 'team_admin') {
      throw new HttpError('Forbidden - Admin only', HttpStatusCodes.FORBIDDEN)
    }

    try {
      const result = await TEAM_MEMBER_SERVICES.getAll()

      return c.json(
        {
          message: 'Team members retrieved successfully',
          success: true,
          data: {
            teamMembers: result.teamMembers.map(tm => ({
              ...tm,
              user: {
                ...tm.user,
                createdAt: tm.user.createdAt.toISOString(),
              },
              createdAt: tm.createdAt.toISOString(),
              updatedAt: tm.updatedAt.toISOString(),
            })),
          },
        },
        HttpStatusCodes.OK
      )
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to retrieve team members'
      throw new HttpError(message, HttpStatusCodes.INTERNAL_SERVER_ERROR)
    }
  },

  getByUserId: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only admins can view team members
    if (user.role !== 'admin' && user.role !== 'team_admin') {
      throw new HttpError('Forbidden - Admin only', HttpStatusCodes.FORBIDDEN)
    }

    const { userId } = c.req.valid('param')

    try {
      const teamMember = await TEAM_MEMBER_SERVICES.getByUserId(userId)

      // If team member not found, return 404
      if (!teamMember) {
        throw new HttpError('Team member not found', HttpStatusCodes.NOT_FOUND)
      }

      return c.json(
        {
          message: 'Team member retrieved successfully',
          success: true,
          data: {
            ...teamMember,
            user: {
              ...teamMember.user,
              createdAt: teamMember.user.createdAt.toISOString(),
            },
            createdAt: teamMember.createdAt.toISOString(),
            updatedAt: teamMember.updatedAt.toISOString(),
          },
        },
        HttpStatusCodes.OK
      )
    } catch (error: unknown) {
      if (error instanceof HttpError) {
        throw error
      }
      const message = error instanceof Error ? error.message : 'Failed to retrieve team member'
      throw new HttpError(message, HttpStatusCodes.INTERNAL_SERVER_ERROR)
    }
  },

  create: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only admins can create team members
    if (user.role !== 'admin' && user.role !== 'team_admin') {
      throw new HttpError('Forbidden - Admin only', HttpStatusCodes.FORBIDDEN)
    }

    const body = c.req.valid('json')

    try {
      const teamMember = await TEAM_MEMBER_SERVICES.create(body)

      return c.json(
        {
          message: 'Team member created successfully',
          success: true,
          data: {
            ...teamMember,
            user: {
              ...teamMember.user,
              createdAt: teamMember.user.createdAt.toISOString(),
            },
            createdAt: teamMember.createdAt.toISOString(),
            updatedAt: teamMember.updatedAt.toISOString(),
          },
        },
        HttpStatusCodes.CREATED
      )
    } catch (error: unknown) {
      if (error instanceof HttpError) {
        throw error
      }
      const message = error instanceof Error ? error.message : 'Failed to create team member'
      throw new HttpError(message, HttpStatusCodes.INTERNAL_SERVER_ERROR)
    }
  },

  updateRole: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only admins can update team member roles
    if (user.role !== 'admin' && user.role !== 'team_admin') {
      throw new HttpError('Forbidden - Admin only', HttpStatusCodes.FORBIDDEN)
    }

    const { userId } = c.req.valid('param')
    const { roleId } = c.req.valid('json')

    try {
      const teamMember = await TEAM_MEMBER_SERVICES.updateRole(userId, roleId)

      return c.json(
        {
          message: 'Team member role updated successfully',
          success: true,
          data: {
            ...teamMember,
            user: {
              ...teamMember.user,
              createdAt: teamMember.user.createdAt.toISOString(),
            },
            createdAt: teamMember.createdAt.toISOString(),
            updatedAt: teamMember.updatedAt.toISOString(),
          },
        },
        HttpStatusCodes.OK
      )
    } catch (error: unknown) {
      if (error instanceof HttpError) {
        throw error
      }
      const message = error instanceof Error ? error.message : 'Failed to update team member role'
      throw new HttpError(message, HttpStatusCodes.INTERNAL_SERVER_ERROR)
    }
  },

  delete: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only admins can remove team members
    if (user.role !== 'admin' && user.role !== 'team_admin') {
      throw new HttpError('Forbidden - Admin only', HttpStatusCodes.FORBIDDEN)
    }

    const { userId } = c.req.valid('param')

    try {
      await TEAM_MEMBER_SERVICES.delete(userId)

      return c.json(
        {
          message: 'Team member removed successfully',
          success: true,
          data: { success: true },
        },
        HttpStatusCodes.OK
      )
    } catch (error: unknown) {
      if (error instanceof HttpError) {
        throw error
      }
      const message = error instanceof Error ? error.message : 'Failed to remove team member'
      throw new HttpError(message, HttpStatusCodes.INTERNAL_SERVER_ERROR)
    }
  },
}

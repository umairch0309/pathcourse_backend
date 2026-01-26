import * as HttpStatusCodes from 'stoker/http-status-codes'
import { auth } from '~/lib/auth'
import { HttpError } from '~/lib/error'
import prisma from '~/lib/prisma'

export const TEAM_MEMBER_SERVICES = {
  /**
   * Get all team members with their roles and permissions
   */
  getAll: async () => {
    const teamMembers = await (prisma as any).teamMember.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            createdAt: true,
          },
        },
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return {
      teamMembers: teamMembers.map(tm => ({
        id: tm.id,
        userId: tm.userId,
        user: tm.user,
        role: {
          id: tm.role.id,
          name: tm.role.name,
          description: tm.role.description,
          permissions: tm.role.rolePermissions.map(rp => ({
            id: rp.permission.id,
            name: rp.permission.name,
            slug: rp.permission.slug,
          })),
        },
        createdAt: tm.createdAt,
        updatedAt: tm.updatedAt,
      })),
    }
  },

  /**
   * Get team member by user ID
   * Returns null if not found (for admins without team member records)
   */
  getByUserId: async (userId: string) => {
    const teamMember = await (prisma as any).teamMember.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            createdAt: true,
          },
        },
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    })

    if (!teamMember) {
      return null
    }

    return {
      id: teamMember.id,
      userId: teamMember.userId,
      user: teamMember.user,
      role: {
        id: teamMember.role.id,
        name: teamMember.role.name,
        description: teamMember.role.description,
        permissions: teamMember.role.rolePermissions.map(rp => ({
          id: rp.permission.id,
          name: rp.permission.name,
          slug: rp.permission.slug,
        })),
      },
      createdAt: teamMember.createdAt,
      updatedAt: teamMember.updatedAt,
    }
  },

  /**
   * Add a new team member (create user and assign role)
   */
  create: async (data: { name: string; email: string; password: string; roleId: string }) => {
    // Check if user with email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (existingUser) {
      throw new HttpError('User with this email already exists', HttpStatusCodes.CONFLICT)
    }

    // Verify role exists
    const role = await (prisma as any).role.findUnique({
      where: { id: data.roleId },
    })

    if (!role) {
      throw new HttpError('Role not found', HttpStatusCodes.NOT_FOUND)
    }

    // Create user using better-auth
    const user = await auth.api.signUpEmail({
      body: {
        email: data.email,
        password: data.password,
        name: data.name,
      },
    })

    if (!user || !user.user) {
      throw new HttpError('Failed to create user', HttpStatusCodes.INTERNAL_SERVER_ERROR)
    }

    // Update user role to admin
    await (prisma as any).user.update({
      where: { id: user.user.id },
      data: {
        role: 'admin',
        onboardingStage: 'COMPLETED',
      },
    })

    // Create team member record
    const teamMember = await (prisma as any).teamMember.create({
      data: {
        userId: user.user.id,
        roleId: data.roleId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            createdAt: true,
          },
        },
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    })

    return {
      id: teamMember.id,
      userId: teamMember.userId,
      user: teamMember.user,
      role: {
        id: teamMember.role.id,
        name: teamMember.role.name,
        description: teamMember.role.description,
        permissions: teamMember.role.rolePermissions.map(rp => ({
          id: rp.permission.id,
          name: rp.permission.name,
          slug: rp.permission.slug,
        })),
      },
      createdAt: teamMember.createdAt,
      updatedAt: teamMember.updatedAt,
    }
  },

  /**
   * Update team member's role
   */
  updateRole: async (userId: string, roleId: string) => {
    const teamMember = await (prisma as any).teamMember.findUnique({
      where: { userId },
    })

    if (!teamMember) {
      throw new HttpError('Team member not found', HttpStatusCodes.NOT_FOUND)
    }

    // Verify role exists
    const role = await (prisma as any).role.findUnique({
      where: { id: roleId },
    })

    if (!role) {
      throw new HttpError('Role not found', HttpStatusCodes.NOT_FOUND)
    }

    const updated = await (prisma as any).teamMember.update({
      where: { userId },
      data: { roleId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            createdAt: true,
          },
        },
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    })

    return {
      id: updated.id,
      userId: updated.userId,
      user: updated.user,
      role: {
        id: updated.role.id,
        name: updated.role.name,
        description: updated.role.description,
        permissions: updated.role.rolePermissions.map(rp => ({
          id: rp.permission.id,
          name: rp.permission.name,
          slug: rp.permission.slug,
        })),
      },
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    }
  },

  /**
   * Remove team member (delete team member record, but keep user)
   */
  delete: async (userId: string) => {
    const teamMember = await (prisma as any).teamMember.findUnique({
      where: { userId },
    })

    if (!teamMember) {
      throw new HttpError('Team member not found', HttpStatusCodes.NOT_FOUND)
    }

    await (prisma as any).teamMember.delete({
      where: { userId },
    })

    // Optionally update user role back to guest or remove admin role
    await (prisma as any).user.update({
      where: { id: userId },
      data: {
        role: null,
      },
    })

    return { success: true }
  },
}

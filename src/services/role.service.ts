import * as HttpStatusCodes from 'stoker/http-status-codes'
import { HttpError } from '~/lib/error'
import prisma from '~/lib/prisma'

export const ROLE_SERVICES = {
  /**
   * Get all roles with their permissions
   */
  getAll: async () => {
    const roles = await prisma.role.findMany({
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return {
      roles: roles.map(role => ({
        id: role.id,
        name: role.name,
        description: role.description,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
        permissions: role.rolePermissions.map(rp => ({
          id: rp.permission.id,
          name: rp.permission.name,
          slug: rp.permission.slug,
          description: rp.permission.description,
        })),
      })),
    }
  },

  /**
   * Get role by ID with permissions
   */
  getById: async (id: string) => {
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    })

    if (!role) {
      throw new HttpError('Role not found', HttpStatusCodes.NOT_FOUND)
    }

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      permissions: role.rolePermissions.map(rp => ({
        id: rp.permission.id,
        name: rp.permission.name,
        slug: rp.permission.slug,
        description: rp.permission.description,
      })),
    }
  },

  /**
   * Create a new role
   */
  create: async (data: { name: string; description?: string }) => {
    // Check if role with same name already exists
    const existing = await prisma.role.findUnique({
      where: { name: data.name },
    })

    if (existing) {
      throw new HttpError('Role with this name already exists', HttpStatusCodes.CONFLICT)
    }

    const role = await prisma.role.create({
      data: {
        name: data.name,
        description: data.description || null,
      },
    })

    return role
  },

  /**
   * Update a role
   */
  update: async (id: string, data: { name?: string; description?: string }) => {
    const role = await prisma.role.findUnique({
      where: { id },
    })

    if (!role) {
      throw new HttpError('Role not found', HttpStatusCodes.NOT_FOUND)
    }

    // Check if name is being changed and if new name already exists
    if (data.name && data.name !== role.name) {
      const existing = await prisma.role.findUnique({
        where: { name: data.name },
      })

      if (existing) {
        throw new HttpError('Role with this name already exists', HttpStatusCodes.CONFLICT)
      }
    }

    const updated = await prisma.role.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description || null }),
      },
    })

    return updated
  },

  /**
   * Delete a role
   */
  delete: async (id: string) => {
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        teamMembers: true,
      },
    })

    if (!role) {
      throw new HttpError('Role not found', HttpStatusCodes.NOT_FOUND)
    }

    // Check if role is assigned to any team members
    if (role.teamMembers.length > 0) {
      throw new HttpError(
        'Cannot delete role that is assigned to team members',
        HttpStatusCodes.BAD_REQUEST
      )
    }

    await prisma.role.delete({
      where: { id },
    })

    return { success: true }
  },

  /**
   * Assign permissions to a role
   */
  assignPermissions: async (roleId: string, permissionIds: string[]) => {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    })

    if (!role) {
      throw new HttpError('Role not found', HttpStatusCodes.NOT_FOUND)
    }

    // Verify all permissions exist
    const permissions = await prisma.permission.findMany({
      where: {
        id: {
          in: permissionIds,
        },
      },
    })

    if (permissions.length !== permissionIds.length) {
      throw new HttpError('One or more permissions not found', HttpStatusCodes.NOT_FOUND)
    }

    // Remove existing permissions
    await prisma.rolePermission.deleteMany({
      where: { roleId },
    })

    // Add new permissions
    if (permissionIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissionIds.map(permissionId => ({
          roleId,
          permissionId,
        })),
      })
    }

    return await ROLE_SERVICES.getById(roleId)
  },

  /**
   * Get permissions for a role
   */
  getRolePermissions: async (roleId: string) => {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    })

    if (!role) {
      throw new HttpError('Role not found', HttpStatusCodes.NOT_FOUND)
    }

    return {
      roleId: role.id,
      roleName: role.name,
      permissions: role.rolePermissions.map(rp => ({
        id: rp.permission.id,
        name: rp.permission.name,
        slug: rp.permission.slug,
        description: rp.permission.description,
      })),
    }
  },
}

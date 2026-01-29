import * as HttpStatusCodes from 'stoker/http-status-codes'
import { HttpError } from '~/lib/error'
import prisma from '~/lib/prisma'

export const PERMISSION_SERVICES = {
  /**
   * Get all permissions
   */
  getAll: async () => {
    const permissions = await prisma.permission.findMany({
      orderBy: {
        name: 'asc',
      },
    })

    return { permissions }
  },

  /**
   * Get permission by ID
   */
  getById: async (id: string) => {
    const permission = await prisma.permission.findUnique({
      where: { id },
    })

    if (!permission) {
      throw new HttpError('Permission not found', HttpStatusCodes.NOT_FOUND)
    }

    return permission
  },

  /**
   * Get permission by slug
   */
  getBySlug: async (slug: string) => {
    const permission = await prisma.permission.findUnique({
      where: { slug },
    })

    return permission
  },

  /**
   * Create a new permission
   */
  create: async (data: { name: string; slug: string; description?: string }) => {
    // Check if permission with same slug already exists
    const existing = await prisma.permission.findUnique({
      where: { slug: data.slug },
    })

    if (existing) {
      throw new HttpError('Permission with this slug already exists', HttpStatusCodes.CONFLICT)
    }

    const permission = await prisma.permission.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
      },
    })

    return permission
  },

  /**
   * Update a permission
   */
  update: async (id: string, data: { name?: string; slug?: string; description?: string }) => {
    const permission = await prisma.permission.findUnique({
      where: { id },
    })

    if (!permission) {
      throw new HttpError('Permission not found', HttpStatusCodes.NOT_FOUND)
    }

    // Check if slug is being changed and if new slug already exists
    if (data.slug && data.slug !== permission.slug) {
      const existing = await prisma.permission.findUnique({
        where: { slug: data.slug },
      })

      if (existing) {
        throw new HttpError('Permission with this slug already exists', HttpStatusCodes.CONFLICT)
      }
    }

    const updated = await prisma.permission.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.slug && { slug: data.slug }),
        ...(data.description !== undefined && { description: data.description || null }),
      },
    })

    return updated
  },

  /**
   * Delete a permission
   */
  delete: async (id: string) => {
    const permission = await prisma.permission.findUnique({
      where: { id },
    })

    if (!permission) {
      throw new HttpError('Permission not found', HttpStatusCodes.NOT_FOUND)
    }

    await prisma.permission.delete({
      where: { id },
    })

    return { success: true }
  },
}

import * as HttpStatusCodes from 'stoker/http-status-codes'
import { HttpError } from '~/lib/error'
import prisma from '~/lib/prisma'

/**
 * Check if a user has a specific permission
 */
export async function hasPermission(userId: string, permissionSlug: string): Promise<boolean> {
  // Get user to check if they're admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })

  // If user is admin but not a team member, grant all permissions (super admin)
  // Check role case-insensitively to handle 'admin', 'ADMIN', etc.
  if (user?.role?.toLowerCase() === 'admin') {
    // Check if they have a team member record
    const teamMemberCheck = await (prisma as any).teamMember.findUnique({
      where: { userId },
    })

    // If admin but no team member record, grant all permissions (backward compatibility)
    if (!teamMemberCheck) {
      return true
    }
  }

  // Get team member with role and permissions
  const teamMember = await (prisma as any).teamMember.findUnique({
    where: { userId },
    include: {
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
    return false
  }

  // Check if any permission matches the required slug
  return teamMember.role.rolePermissions.some((rp: any) => rp.permission.slug === permissionSlug)
}

/**
 * Middleware/helper to check permission and throw error if not authorized
 */
export async function requirePermission(userId: string, permissionSlug: string): Promise<void> {
  const hasAccess = await hasPermission(userId, permissionSlug)

  if (!hasAccess) {
    throw new HttpError(
      `You do not have permission to perform this action. Required permission: ${permissionSlug}`,
      HttpStatusCodes.FORBIDDEN
    )
  }
}

/**
 * Get all permissions for a user
 */
export async function getUserPermissions(userId: string): Promise<string[]> {
  // Get user to check if they're admin
  const user = await (prisma as any).user.findUnique({
    where: { id: userId },
    select: { role: true },
  })

  // Get team member with role and permissions
  const teamMember = await (prisma as any).teamMember.findUnique({
    where: { userId },
    include: {
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

  // If user is admin but not a team member, return all permissions (super admin - backward compatibility)
  // Check role case-insensitively to handle 'admin', 'ADMIN', etc.
  if (user?.role?.toLowerCase() === 'admin' && !teamMember) {
    return Object.values(PERMISSION_SLUGS)
  }

  // If no team member record, return empty array
  if (!teamMember) {
    return []
  }

  return teamMember.role.rolePermissions.map((rp: any) => rp.permission.slug)
}

/**
 * Permission slugs constants
 */
export const PERMISSION_SLUGS = {
  DASHBOARD_VIEW: 'dashboard.view',
  ENTERPRISE_ADD: 'enterprise.add',
  ENTERPRISE_VIEW: 'enterprise.view',
  ENTERPRISE_UPDATE: 'enterprise.update',
  ENTERPRISE_DELETE: 'enterprise.delete',
  SPECIALISTS_VIEW: 'specialists.view',
  SPECIALISTS_ADD: 'specialists.add',
  SPECIALISTS_BLOCK_UNBLOCK: 'specialists.block_unblock',
  SPECIALISTS_ACCEPT_REJECT: 'specialists.accept_reject',
  USERS_VIEW: 'users.view',
  SESSIONS_VIEW: 'sessions.view',
  USER_INQUIRIES_VIEW: 'user_inquiries.view',
  USER_INQUIRIES_DELETE: 'user_inquiries.delete',
  SETTINGS_VIEW: 'settings.view',
} as const

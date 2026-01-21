import * as HttpStatusCodes from 'stoker/http-status-codes'

import { HttpError } from '~/lib/error'
import prisma from '~/lib/prisma'
import { extractS3KeyFromUrl, keysToSignedUrls } from '~/lib/s3'
import type { USER_ROUTES } from '~/routes/user/user.routes'
import { USER_SERVICES } from '~/services/user.service'
import type { HandlerMapFromRoutes } from '~/types'

// Helper to convert user image key or URL to a signed URL
const convertUserImageToSignedUrl = async (
  imageKeyOrUrl: string | null | undefined
): Promise<string | null> => {
  if (!imageKeyOrUrl) {
    return null
  }
  if (imageKeyOrUrl.startsWith('http://') || imageKeyOrUrl.startsWith('https://')) {
    return imageKeyOrUrl
  }
  const key = extractS3KeyFromUrl(imageKeyOrUrl)
  if (!key) {
    return imageKeyOrUrl
  }
  const signedUrl = await keysToSignedUrls(key, 7 * 24 * 3600) // 7 days
  return Array.isArray(signedUrl) ? signedUrl[0] : signedUrl
}

export const USER_ROUTES_HANDLER: HandlerMapFromRoutes<typeof USER_ROUTES> = {
  selectRole: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    const { role } = c.req.valid('json')

    await USER_SERVICES.updateRole({
      userId: user.id,
      role,
    })

    return c.json(
      {
        message: 'Role selected successfully',
        success: true,
      },
      HttpStatusCodes.OK
    )
  },

  createOrUpdateUserInfo: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    const { gender, dateOfBirth, phone, address } = c.req.valid('json')

    const userInfo = await USER_SERVICES.createOrUpdateUserInfo({
      userId: user.id,
      gender: gender || null,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      phone: phone || null,
      address: address || null,
    })

    // Format response
    const formattedUserInfo = {
      id: userInfo.id,
      userId: userInfo.userId,
      gender: userInfo.gender,
      dateOfBirth: userInfo.dateOfBirth?.toISOString() || null,
      phone: userInfo.phone,
      address: userInfo.address,
      createdAt: userInfo.createdAt.toISOString(),
      updatedAt: userInfo.updatedAt.toISOString(),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
      },
    }

    return c.json(
      {
        message: 'User info created or updated successfully',
        success: true,
        data: formattedUserInfo,
      },
      HttpStatusCodes.OK
    )
  },

  updateUserProfile: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only patients can update their profile via this endpoint
    if (user.role !== 'patient') {
      throw new HttpError('Only patients can access this endpoint', HttpStatusCodes.FORBIDDEN)
    }

    const { name, image, gender, dateOfBirth, phone, address } = c.req.valid('json')

    try {
      // Update basic user fields if provided
      if (name !== undefined || image !== undefined) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            name: name !== undefined ? name : undefined,
            image: image !== undefined ? image : undefined,
          },
        })
      }

      // Update or create userInfo
      const userInfo = await USER_SERVICES.createOrUpdateUserInfo({
        userId: user.id,
        gender: gender ?? null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        phone: phone ?? null,
        address: address ?? null,
      })

      // Fetch latest user data (including anonymity flags and employeeCode)
      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          employeeCode: true,
          isAnonymous: true,
        },
      })

      if (!fullUser) {
        throw new HttpError('User not found', HttpStatusCodes.NOT_FOUND)
      }

      const formattedUserInfo = {
        id: userInfo.id,
        userId: userInfo.userId,
        gender: userInfo.gender,
        dateOfBirth: userInfo.dateOfBirth?.toISOString() || null,
        phone: userInfo.phone,
        address: userInfo.address,
        createdAt: userInfo.createdAt.toISOString(),
        updatedAt: userInfo.updatedAt.toISOString(),
        user: {
          id: fullUser.id,
          name: fullUser.name,
          email: fullUser.email,
          image: fullUser.image,
          role: fullUser.role,
          employeeCode: fullUser.employeeCode || null,
          isAnonymous: fullUser.isAnonymous || false,
        },
      }

      return c.json(
        {
          message: 'User profile updated successfully',
          success: true,
          data: formattedUserInfo,
        },
        HttpStatusCodes.OK
      )
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update user profile'
      throw new HttpError(message, HttpStatusCodes.INTERNAL_SERVER_ERROR)
    }
  },

  getUserInfo: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    const userInfo = await USER_SERVICES.getUserInfo(user.id)

    // If user info doesn't exist, return default/empty structure instead of 404
    // This allows frontend to check if user info exists without getting an error
    if (!userInfo) {
      // Fetch full user data to get employeeCode and isAnonymous
      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          employeeCode: true,
          isAnonymous: true,
          image: true,
        },
      })

      const userImage = await convertUserImageToSignedUrl(user.image ?? fullUser?.image ?? null)

      const defaultUserInfo = {
        id: null,
        userId: user.id,
        gender: null,
        dateOfBirth: null,
        phone: null,
        address: null,
        createdAt: null,
        updatedAt: null,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: userImage,
          role: user.role,
          employeeCode: fullUser?.employeeCode || null,
          isAnonymous: fullUser?.isAnonymous || false,
        },
      }

      return c.json(
        {
          message: 'User info not found. Please create user info first.',
          success: true,
          data: defaultUserInfo,
        },
        HttpStatusCodes.OK
      )
    }

    // Format response
    const userImage = await convertUserImageToSignedUrl(userInfo.user.image)

    const formattedUserInfo = {
      id: userInfo.id,
      userId: userInfo.userId,
      gender: userInfo.gender,
      dateOfBirth: userInfo.dateOfBirth?.toISOString() || null,
      phone: userInfo.phone,
      address: userInfo.address,
      createdAt: userInfo.createdAt.toISOString(),
      updatedAt: userInfo.updatedAt.toISOString(),
      user: {
        id: userInfo.user.id,
        name: userInfo.user.name,
        email: userInfo.user.email,
        image: userImage,
        role: userInfo.user.role,
        employeeCode: userInfo.user.employeeCode || null,
        isAnonymous: userInfo.user.isAnonymous || false,
      },
    }

    return c.json(
      {
        message: 'User info retrieved successfully',
        success: true,
        data: formattedUserInfo,
      },
      HttpStatusCodes.OK
    )
  },

  getPatientProfile: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only patients can access this endpoint
    if (user.role !== 'patient') {
      throw new HttpError('Only patients can access this endpoint', HttpStatusCodes.FORBIDDEN)
    }

    const userInfo = await USER_SERVICES.getUserInfo(user.id)

    // If user info doesn't exist, return default/empty structure instead of 404
    if (!userInfo) {
      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          employeeCode: true,
          isAnonymous: true,
          image: true,
        },
      })

      const userImage = await convertUserImageToSignedUrl(user.image ?? fullUser?.image ?? null)

      const defaultUserInfo = {
        id: null,
        userId: user.id,
        gender: null,
        dateOfBirth: null,
        phone: null,
        address: null,
        createdAt: null,
        updatedAt: null,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: userImage,
          role: user.role,
          employeeCode: fullUser?.employeeCode || null,
          isAnonymous: fullUser?.isAnonymous || false,
        },
      }

      return c.json(
        {
          message: 'Patient info not found. Please create user info first.',
          success: true,
          data: defaultUserInfo,
        },
        HttpStatusCodes.OK
      )
    }

    const userImage = await convertUserImageToSignedUrl(userInfo.user.image)

    const formattedUserInfo = {
      id: userInfo.id,
      userId: userInfo.userId,
      gender: userInfo.gender,
      dateOfBirth: userInfo.dateOfBirth?.toISOString() || null,
      phone: userInfo.phone,
      address: userInfo.address,
      createdAt: userInfo.createdAt.toISOString(),
      updatedAt: userInfo.updatedAt.toISOString(),
      user: {
        id: userInfo.user.id,
        name: userInfo.user.name,
        email: userInfo.user.email,
        image: userImage,
        role: userInfo.user.role,
        employeeCode: userInfo.user.employeeCode || null,
        isAnonymous: userInfo.user.isAnonymous || false,
      },
    }

    return c.json(
      {
        message: 'Patient profile retrieved successfully',
        success: true,
        data: formattedUserInfo,
      },
      HttpStatusCodes.OK
    )
  },

  toggleAnonymousMode: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    try {
      const updatedUser = await USER_SERVICES.toggleAnonymousMode(user.id)

      return c.json(
        {
          message: updatedUser.isAnonymous
            ? 'Anonymous mode enabled. Your name and email will be hidden.'
            : 'Anonymous mode disabled. Your name and email will be visible.',
          success: true,
          data: {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            isAnonymous: updatedUser.isAnonymous,
            employeeCode: updatedUser.employeeCode,
          },
        },
        HttpStatusCodes.OK
      )
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message === 'User not found') {
          throw new HttpError('User not found', HttpStatusCodes.NOT_FOUND)
        }
        if (error.message === 'Only patients can use anonymous mode') {
          throw new HttpError('Only patients can use anonymous mode', HttpStatusCodes.FORBIDDEN)
        }
        throw new HttpError(error.message || 'Failed to toggle anonymous mode', HttpStatusCodes.INTERNAL_SERVER_ERROR)
      }
      throw new HttpError('Failed to toggle anonymous mode', HttpStatusCodes.INTERNAL_SERVER_ERROR)
    }
  },
}


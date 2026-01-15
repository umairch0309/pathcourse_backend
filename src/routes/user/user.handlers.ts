import * as HttpStatusCodes from 'stoker/http-status-codes'

import { HttpError } from '~/lib/error'
import type { USER_ROUTES } from '~/routes/user/user.routes'
import { USER_SERVICES } from '~/services/user.service'
import type { HandlerMapFromRoutes } from '~/types'

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

  getUserInfo: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    const userInfo = await USER_SERVICES.getUserInfo(user.id)

    // If user info doesn't exist, return default/empty structure instead of 404
    // This allows frontend to check if user info exists without getting an error
    if (!userInfo) {
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
          image: user.image,
          role: user.role,
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
        image: userInfo.user.image,
        role: userInfo.user.role,
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
}


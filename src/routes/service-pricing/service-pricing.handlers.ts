import * as HttpStatusCodes from 'stoker/http-status-codes'

import { HttpError } from '~/lib/error'
import prisma from '~/lib/prisma'
import type { SERVICE_PRICING_ROUTES } from '~/routes/service-pricing/service-pricing.routes'
import { SERVICE_PRICING_SERVICES } from '~/services/service-pricing.service'
import type { HandlerMapFromRoutes } from '~/types'

const formatServicePricingResponse = (pricing: any) => ({
  id: pricing.id,
  serviceId: pricing.serviceId,
  service: pricing.service
    ? {
        id: pricing.service.id,
        name: pricing.service.name,
      }
    : undefined,
  duration: pricing.duration,
  userPrice: Number(pricing.userPrice),
  doctorAmount: Number(pricing.doctorAmount),
  platformAmount: Number(pricing.platformAmount),
  isActive: pricing.isActive,
  createdAt: pricing.createdAt.toISOString(),
  updatedAt: pricing.updatedAt.toISOString(),
})

export const SERVICE_PRICING_ROUTES_HANDLER: HandlerMapFromRoutes<typeof SERVICE_PRICING_ROUTES> = {
  getAll: async c => {
    const pricing = await SERVICE_PRICING_SERVICES.getAll()

    return c.json(
      {
        message: 'Service pricing retrieved successfully',
        success: true,
        data: {
          pricing: pricing.map(formatServicePricingResponse),
        },
      },
      HttpStatusCodes.OK
    )
  },

  getByDuration: async c => {
    const { duration } = c.req.valid('param')
    const durationNum = parseInt(duration, 10)

    if (isNaN(durationNum)) {
      throw new HttpError('Invalid duration', HttpStatusCodes.BAD_REQUEST)
    }

    const pricing = await SERVICE_PRICING_SERVICES.getByDuration(durationNum)

    if (!pricing) {
      throw new HttpError('Service pricing not found', HttpStatusCodes.NOT_FOUND)
    }

    return c.json(
      {
        message: 'Service pricing retrieved successfully',
        success: true,
        data: formatServicePricingResponse(pricing),
      },
      HttpStatusCodes.OK
    )
  },

  create: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only admins can create service pricing
    if (user.role !== 'admin') {
      throw new HttpError('Forbidden - Admin only', HttpStatusCodes.FORBIDDEN)
    }

    const { serviceId, duration, userPrice, doctorAmount, platformAmount } = c.req.valid('json')

    try {
      const pricing = await SERVICE_PRICING_SERVICES.create({
        serviceId,
        duration,
        userPrice,
        doctorAmount,
        platformAmount,
      })

      return c.json(
        {
          message: 'Service pricing created successfully',
          success: true,
          data: formatServicePricingResponse(pricing),
        },
        HttpStatusCodes.CREATED
      )
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new HttpError('Service pricing for this duration already exists', HttpStatusCodes.CONFLICT)
      }
      if (error.message.includes('must equal')) {
        throw new HttpError(error.message, HttpStatusCodes.UNPROCESSABLE_ENTITY)
      }
      throw error
    }
  },

  update: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only admins can update service pricing
    if (user.role !== 'admin') {
      throw new HttpError('Forbidden - Admin only', HttpStatusCodes.FORBIDDEN)
    }

    const { id } = c.req.valid('param')
    const data = c.req.valid('json')

    try {
      const pricing = await SERVICE_PRICING_SERVICES.update(id, data)

      return c.json(
        {
          message: 'Service pricing updated successfully',
          success: true,
          data: formatServicePricingResponse(pricing),
        },
        HttpStatusCodes.OK
      )
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new HttpError('Service pricing not found', HttpStatusCodes.NOT_FOUND)
      }
      if (error.message.includes('must equal')) {
        throw new HttpError(error.message, HttpStatusCodes.UNPROCESSABLE_ENTITY)
      }
      throw error
    }
  },

  updateByDuration: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only admins can update service pricing
    if (user.role !== 'admin') {
      throw new HttpError('Forbidden - Admin only', HttpStatusCodes.FORBIDDEN)
    }

    const { duration } = c.req.valid('param')
    const durationNum = parseInt(duration, 10)

    if (isNaN(durationNum)) {
      throw new HttpError('Invalid duration', HttpStatusCodes.BAD_REQUEST)
    }

    const query = c.req.valid('query')
    const data = c.req.valid('json')

    // Get service ID from query, default to "Open Ear" service
    let finalServiceId: string = query.serviceId || ''
    if (!finalServiceId) {
      // Try to find the "Open Ear" service
      const openEarService = await (prisma as any).service.findUnique({
        where: { name: 'Open Ear' },
      })
      if (!openEarService) {
        throw new HttpError('Service not found. Please provide serviceId in query.', HttpStatusCodes.BAD_REQUEST)
      }
      finalServiceId = openEarService.id
    }

    try {
      const pricing = await SERVICE_PRICING_SERVICES.updateByDuration(durationNum, finalServiceId, data)

      return c.json(
        {
          message: 'Service pricing updated successfully',
          success: true,
          data: formatServicePricingResponse(pricing),
        },
        HttpStatusCodes.OK
      )
    } catch (error: any) {
      if (error.code === 'P2025' || error.message.includes('not found')) {
        throw new HttpError('Service pricing not found', HttpStatusCodes.NOT_FOUND)
      }
      if (error.message.includes('must equal')) {
        throw new HttpError(error.message, HttpStatusCodes.UNPROCESSABLE_ENTITY)
      }
      throw error
    }
  },

  delete: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only admins can delete service pricing
    if (user.role !== 'admin') {
      throw new HttpError('Forbidden - Admin only', HttpStatusCodes.FORBIDDEN)
    }

    const { id } = c.req.valid('param')

    try {
      await SERVICE_PRICING_SERVICES.delete(id)

      return c.json(
        {
          message: 'Service pricing deleted successfully',
          success: true,
        },
        HttpStatusCodes.OK
      )
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new HttpError('Service pricing not found', HttpStatusCodes.NOT_FOUND)
      }
      throw error
    }
  },
}


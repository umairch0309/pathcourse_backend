import * as HttpStatusCodes from 'stoker/http-status-codes'
import { HttpError } from '~/lib/error'
import type { DOCTOR_ROUTES } from '~/routes/doctor/doctor.routes'
import { DOCTOR_SERVICES } from '~/services/doctor.service'
import type { HandlerMapFromRoutes } from '~/types'

export const DOCTOR_ROUTES_HANDLER: HandlerMapFromRoutes<typeof DOCTOR_ROUTES> = {
  createOrUpdate: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only doctors can create or update doctor information
    if (user.role !== 'doctor') {
      throw new HttpError('Only doctors can access this endpoint', HttpStatusCodes.FORBIDDEN)
    }

    const body = c.req.valid('json')

    try {
      const doctor = await DOCTOR_SERVICES.createOrUpdate({
        userId: user.id,
        professional_contact: body.professional_contact,
        professional_email: body.professional_email,
        image: body.image,
        gender: body.gender,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
        phone: body.phone,
        address: body.address,
      })

      // Format response
      const formattedDoctor = {
        id: doctor.id,
        userid: doctor.userid,
        professional_contact: doctor.professional_contact,
        professional_email: doctor.professional_email,
        isAvailable: doctor.isAvailable,
        isInMeeting: doctor.isInMeeting,
        availableDurations: doctor.availableDurations,
        createdAt: doctor.createdAt.toISOString(),
        updatedAt: doctor.updatedAt.toISOString(),
        user: {
          id: doctor.user.id,
          name: doctor.user.name,
          email: doctor.user.email,
          image: doctor.user.image,
          role: doctor.user.role,
        },
      }

      return c.json(
        {
          message: 'Doctor information created or updated successfully',
          success: true,
          data: formattedDoctor,
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      if (error instanceof HttpError) {
        throw error
      }
      // Handle unique constraint errors
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        throw new HttpError('Professional email already exists', HttpStatusCodes.BAD_REQUEST)
      }
      throw new HttpError(
        'Failed to create or update doctor information',
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  getCurrent: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only doctors can access their own information
    if (user.role !== 'doctor') {
      throw new HttpError('Only doctors can access this endpoint', HttpStatusCodes.FORBIDDEN)
    }

    const doctor = await DOCTOR_SERVICES.getByUserId(user.id)

    if (!doctor) {
      throw new HttpError('Doctor information not found', HttpStatusCodes.NOT_FOUND)
    }

    // Format response
    const formattedDoctor = {
      id: doctor.id,
      userid: doctor.userid,
      professional_contact: doctor.professional_contact,
      professional_email: doctor.professional_email,
      isAvailable: doctor.isAvailable,
      isInMeeting: doctor.isInMeeting,
      availableDurations: doctor.availableDurations,
      createdAt: doctor.createdAt.toISOString(),
      updatedAt: doctor.updatedAt.toISOString(),
      user: {
        id: doctor.user.id,
        name: doctor.user.name,
        email: doctor.user.email,
        image: doctor.user.image,
        role: doctor.user.role,
      },
    }

    return c.json(
      {
        message: 'Doctor information retrieved successfully',
        success: true,
        data: formattedDoctor,
      },
      HttpStatusCodes.OK
    )
  },

  getById: async c => {
    const { id } = c.req.valid('param')

    const doctor = await DOCTOR_SERVICES.getById(id)

    if (!doctor) {
      throw new HttpError('Doctor not found', HttpStatusCodes.NOT_FOUND)
    }

    // Format response
    const formattedDoctor = {
      id: doctor.id,
      userid: doctor.userid,
      professional_contact: doctor.professional_contact,
      professional_email: doctor.professional_email,
      isAvailable: doctor.isAvailable,
      isInMeeting: doctor.isInMeeting,
      availableDurations: doctor.availableDurations,
      createdAt: doctor.createdAt.toISOString(),
      updatedAt: doctor.updatedAt.toISOString(),
      user: {
        id: doctor.user.id,
        name: doctor.user.name,
        email: doctor.user.email,
        image: doctor.user.image,
        role: doctor.user.role,
      },
    }

    return c.json(
      {
        message: 'Doctor information retrieved successfully',
        success: true,
        data: formattedDoctor,
      },
      HttpStatusCodes.OK
    )
  },
}

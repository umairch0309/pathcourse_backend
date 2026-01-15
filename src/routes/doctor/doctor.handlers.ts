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
      rejectReason: doctor.rejectReason,
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

    // Format complete response with all related data
    const formattedDoctor = {
      id: doctor.id,
      userid: doctor.userid,
      professional_contact: doctor.professional_contact,
      professional_email: doctor.professional_email,
      secondary_contact: doctor.secondary_contact,
      isAvailable: doctor.isAvailable,
      isInMeeting: doctor.isInMeeting,
      createdAt: doctor.createdAt.toISOString(),
      updatedAt: doctor.updatedAt.toISOString(),
      user: {
        id: doctor.user.id,
        name: doctor.user.name,
        email: doctor.user.email,
        image: doctor.user.image,
        role: doctor.user.role,
        onboardingStage: doctor.user.onboardingStage,
      },
      documents: doctor.documents
        ? {
            id: doctor.documents.id,
            resume: doctor.documents.resume,
            medicalLicense: doctor.documents.medicalLicense,
            introductionVideo: doctor.documents.introductionVideo,
          }
        : null,
      education: doctor.education.map(edu => ({
        id: edu.id,
        degree: edu.degree,
        institution_name: edu.institution_name,
        startYear: edu.startYear.toISOString(),
        endYear: edu.endYear?.toISOString() || null,
        document: edu.document,
      })),
      professionalExperience: doctor.professionalExperience
        ? {
            id: doctor.professionalExperience.id,
            profession: doctor.professionalExperience.profession,
            special_interest_area: doctor.professionalExperience.special_interest_area,
            age_group: doctor.professionalExperience.age_group,
            languages: doctor.professionalExperience.languages,
          }
        : null,
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

  toggleAvailability: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only doctors can toggle their availability
    if (user.role !== 'doctor') {
      throw new HttpError('Only doctors can access this endpoint', HttpStatusCodes.FORBIDDEN)
    }

    const doctor = await DOCTOR_SERVICES.toggleAvailability(user.id)

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
        message: `Doctor is now ${doctor.isAvailable ? 'available' : 'unavailable'}`,
        success: true,
        data: formattedDoctor,
      },
      HttpStatusCodes.OK
    )
  },

  getAvailableDoctors: async c => {
    const query = c.req.valid('query')
    const filters = {
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 10,
      search: query.search,
    }

    const result = await DOCTOR_SERVICES.getAvailableDoctors(filters)

    // Format response with complete data
    const formattedDoctors = result.doctors.map(doctor => ({
      id: doctor.id,
      userid: doctor.userid,
      professional_contact: doctor.professional_contact,
      professional_email: doctor.professional_email,
      secondary_contact: doctor.secondary_contact,
      isAvailable: doctor.isAvailable,
      isInMeeting: doctor.isInMeeting,
      createdAt: doctor.createdAt.toISOString(),
      updatedAt: doctor.updatedAt.toISOString(),
      user: {
        id: doctor.user.id,
        name: doctor.user.name,
        email: doctor.user.email,
        image: doctor.user.image,
        role: doctor.user.role,
        onboardingStage: doctor.user.onboardingStage,
      },
      documents: doctor.documents
        ? {
            id: doctor.documents.id,
            resume: doctor.documents.resume,
            medicalLicense: doctor.documents.medicalLicense,
            introductionVideo: doctor.documents.introductionVideo,
          }
        : null,
      education: doctor.education.map(edu => ({
        id: edu.id,
        degree: edu.degree,
        institution_name: edu.institution_name,
        startYear: edu.startYear.toISOString(),
        endYear: edu.endYear?.toISOString() || null,
        document: edu.document,
      })),
      professionalExperience: doctor.professionalExperience
        ? {
            id: doctor.professionalExperience.id,
            profession: doctor.professionalExperience.profession,
            special_interest_area: doctor.professionalExperience.special_interest_area,
            age_group: doctor.professionalExperience.age_group,
            languages: doctor.professionalExperience.languages,
          }
        : null,
    }))

    return c.json(
      {
        message: 'Available doctors retrieved successfully',
        success: true,
        data: {
          doctors: formattedDoctors,
          pagination: result.pagination,
        },
      },
      HttpStatusCodes.OK
    )
  },

  updateMeetingStatus: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only doctors can update their meeting status
    if (user.role !== 'doctor') {
      throw new HttpError('Only doctors can access this endpoint', HttpStatusCodes.FORBIDDEN)
    }

    const { isInMeeting } = c.req.valid('json')

    const doctor = await DOCTOR_SERVICES.updateMeetingStatus(user.id, isInMeeting)

    // Format response
    const formattedDoctor = {
      id: doctor.id,
      userid: doctor.userid,
      professional_contact: doctor.professional_contact,
      professional_email: doctor.professional_email,
      isAvailable: doctor.isAvailable,
      isInMeeting: doctor.isInMeeting,
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
        message: `Doctor is now ${isInMeeting ? 'in a meeting' : 'not in a meeting'}. Availability automatically set to ${doctor.isAvailable ? 'available' : 'unavailable'}.`,
        success: true,
        data: formattedDoctor,
      },
      HttpStatusCodes.OK
    )
  },

  heartbeat: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only doctors can send heartbeat
    if (user.role !== 'doctor') {
      throw new HttpError('Only doctors can access this endpoint', HttpStatusCodes.FORBIDDEN)
    }

    // Get connection ID from query or generate one
    const connectionId = c.req.query('connectionId') || `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const result = await DOCTOR_SERVICES.updateConnectionHeartbeat(user.id, connectionId)

    return c.json(
      {
        message: 'Heartbeat received',
        success: true,
        data: {
          timestamp: result.timestamp.toISOString(),
        },
      },
      HttpStatusCodes.OK
    )
  },

  disconnect: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only doctors can disconnect
    if (user.role !== 'doctor') {
      throw new HttpError('Only doctors can access this endpoint', HttpStatusCodes.FORBIDDEN)
    }

    const result = await DOCTOR_SERVICES.handleDisconnection(user.id)

    return c.json(
      {
        message: 'Disconnection handled. Availability set to unavailable.',
        success: true,
        data: {
          isAvailable: result.isAvailable,
          isInMeeting: result.isInMeeting,
        },
      },
      HttpStatusCodes.OK
    )
  },
}

import * as HttpStatusCodes from 'stoker/http-status-codes'
import { HttpError } from '~/lib/error'
import type { ADMIN_ROUTES } from '~/routes/admin/admin.routes'
import { DOCTOR_SERVICES } from '~/services/doctor.service'
import type { HandlerMapFromRoutes } from '~/types'

const formatDoctorRequestResponse = (doctor: any) => ({
  id: doctor.id,
  userid: doctor.userid,
  professional_contact: doctor.professional_contact,
  professional_email: doctor.professional_email,
  secondary_contact: doctor.secondary_contact,
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
    onboardingStage: doctor.user.onboardingStage,
    createdAt: doctor.user.createdAt.toISOString(),
  },
  documents: doctor.documents
    ? {
        id: doctor.documents.id,
        resume: doctor.documents.resume,
        medicalLicense: doctor.documents.medicalLicense,
        introductionVideo: doctor.documents.introductionVideo,
      }
    : null,
  education: doctor.education.map((edu: any) => ({
    id: edu.id,
    degree: edu.degree,
    institution_name: edu.institution_name,
    startYear: edu.startYear.toISOString(),
    endYear: edu.endYear?.toISOString() || null,
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
})

const formatDoctorStatusResponse = (doctor: any) => ({
  id: doctor.id,
  userid: doctor.userid,
  professional_contact: doctor.professional_contact,
  professional_email: doctor.professional_email,
  rejectReason: doctor.rejectReason,
  user: {
    id: doctor.user.id,
    name: doctor.user.name,
    email: doctor.user.email,
    onboardingStage: doctor.user.onboardingStage,
  },
})

export const ADMIN_ROUTES_HANDLER: HandlerMapFromRoutes<typeof ADMIN_ROUTES> = {
  getDoctorRequests: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only admins can view doctor requests
    if (user.role !== 'admin') {
      throw new HttpError('Forbidden - Admin only', HttpStatusCodes.FORBIDDEN)
    }

    const query = c.req.valid('query')
    const filters = {
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 10,
      search: query.search,
    }

    const result = await DOCTOR_SERVICES.getPendingDoctors(filters)

    return c.json(
      {
        message: 'Doctor requests retrieved successfully',
        success: true,
        data: {
          doctors: result.doctors.map(formatDoctorRequestResponse),
          pagination: result.pagination,
        },
      },
      HttpStatusCodes.OK
    )
  },

  approveDoctor: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only admins can approve doctors
    if (user.role !== 'admin') {
      throw new HttpError('Forbidden - Admin only', HttpStatusCodes.FORBIDDEN)
    }

    const { doctorId } = c.req.valid('json')

    try {
      const doctor = await DOCTOR_SERVICES.approveDoctor(doctorId)

      return c.json(
        {
          message: 'Doctor approved successfully',
          success: true,
          data: formatDoctorStatusResponse(doctor),
        },
        HttpStatusCodes.OK
      )
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      if (errorMessage.includes('not found')) {
        throw new HttpError('Doctor not found', HttpStatusCodes.NOT_FOUND)
      }
      throw new HttpError(
        errorMessage || 'Failed to approve doctor',
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  rejectDoctor: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only admins can reject doctors
    if (user.role !== 'admin') {
      throw new HttpError('Forbidden - Admin only', HttpStatusCodes.FORBIDDEN)
    }

    const { doctorId, rejectReason } = c.req.valid('json')

    try {
      const doctor = await DOCTOR_SERVICES.rejectDoctor(doctorId, rejectReason)

      return c.json(
        {
          message: 'Doctor rejected successfully',
          success: true,
          data: formatDoctorStatusResponse(doctor),
        },
        HttpStatusCodes.OK
      )
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      if (errorMessage.includes('not found')) {
        throw new HttpError('Doctor not found', HttpStatusCodes.NOT_FOUND)
      }
      throw new HttpError(
        errorMessage || 'Failed to reject doctor',
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },
}

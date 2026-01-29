import * as HttpStatusCodes from 'stoker/http-status-codes'
import { HttpError } from '~/lib/error'
import prisma from '~/lib/prisma'
import type { DOCTOR_PROFILE_ROUTES } from '~/routes/doctor-profile/doctor-profile.routes'
import { DOCTOR_SERVICES } from '~/services/doctor.service'
import { DOCUMENTS_SERVICES } from '~/services/documents.service'
import { PROFESSIONAL_EXPERIENCE_SERVICES } from '~/services/professional-experience.service'
import type { HandlerMapFromRoutes } from '~/types'

const formatProfessionalExperienceResponse = (professionalExperience: {
  id: string
  doctorId: string
  age_group: string
  languages: string[]
  profession: string
  special_interest_area: string
  createdAt: Date
  updatedAt: Date
}) => ({
  id: professionalExperience.id,
  doctorId: professionalExperience.doctorId,
  age_group: professionalExperience.age_group,
  languages: professionalExperience.languages,
  profession: professionalExperience.profession,
  special_interest_area: professionalExperience.special_interest_area,
  createdAt: professionalExperience.createdAt.toISOString(),
  updatedAt: professionalExperience.updatedAt.toISOString(),
})

const formatDocumentsResponse = (documents: {
  id: string
  doctorId: string
  resume: string | null
  medicalLicense: string | null
  introductionVideo: string | null
  createdAt: Date
  updatedAt: Date
}) => ({
  id: documents.id,
  doctorId: documents.doctorId,
  resume: documents.resume,
  medicalLicense: documents.medicalLicense,
  introductionVideo: documents.introductionVideo,
  createdAt: documents.createdAt.toISOString(),
  updatedAt: documents.updatedAt.toISOString(),
})

export const DOCTOR_PROFILE_ROUTES_HANDLER: HandlerMapFromRoutes<typeof DOCTOR_PROFILE_ROUTES> = {
  createOrUpdate: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only doctors can create or update their profile
    if (user.role !== 'doctor') {
      throw new HttpError('Only doctors can access this endpoint', HttpStatusCodes.FORBIDDEN)
    }

    // Get doctor record
    const doctor = await DOCTOR_SERVICES.getByUserId(user.id)
    if (!doctor) {
      throw new HttpError('Doctor information not found', HttpStatusCodes.NOT_FOUND)
    }

    const body = c.req.valid('json')

    try {
      // Create or update professional experience and documents in parallel
      const [professionalExperience, documents] = await Promise.all([
        PROFESSIONAL_EXPERIENCE_SERVICES.createOrUpdate({
          doctorId: doctor.id,
          age_group: body.professionalExperience.age_group,
          languages: body.professionalExperience.languages,
          profession: body.professionalExperience.profession,
          special_interest_area: body.professionalExperience.special_interest_area,
        }),
        DOCUMENTS_SERVICES.createOrUpdate({
          doctorId: doctor.id,
          resume: body.documents.resume || null,
          medicalLicense: body.documents.medicalLicense || null,
          introductionVideo: body.documents.introductionVideo || null,
        }),
      ])

      // Update user onboarding stage to WAITING_FOR_ADMIN
      await prisma.user.update({
        where: { id: user.id },
        data: { onboardingStage: 'WAITING_FOR_ADMIN' },
      })

      // Create notifications for doctor onboarding request
      // createNotificationForAllAdmins now notifies all admins and team members
      const { createNotificationForUser, createNotificationForAllAdmins, NOTIFICATION_TYPES } =
        await import('~/lib/notification-helper')
      await Promise.all([
        // Notify doctor
        createNotificationForUser(
          user.id,
          NOTIFICATION_TYPES.DOCTOR_ONBOARDING_REQUEST,
          'Your doctor profile has been submitted and is pending admin approval.'
        ),
        // Notify all admins and team members
        createNotificationForAllAdmins(
          NOTIFICATION_TYPES.DOCTOR_ONBOARDING_REQUEST,
          `New doctor profile submission from ${user.name} is pending approval.`
        ),
      ])

      return c.json(
        {
          message: 'Doctor profile created or updated successfully',
          success: true,
          data: {
            professionalExperience: formatProfessionalExperienceResponse(professionalExperience),
            documents: formatDocumentsResponse(documents),
          },
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      if (error instanceof HttpError) {
        throw error
      }
      if (error instanceof Error && error.message === 'Doctor not found') {
        throw new HttpError('Doctor not found', HttpStatusCodes.NOT_FOUND)
      }
      throw new HttpError(
        'Failed to create or update doctor profile',
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  getCurrent: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only doctors can access their profile
    if (user.role !== 'doctor') {
      throw new HttpError('Only doctors can access this endpoint', HttpStatusCodes.FORBIDDEN)
    }

    // Get doctor record
    const doctor = await DOCTOR_SERVICES.getByUserId(user.id)
    if (!doctor) {
      throw new HttpError('Doctor information not found', HttpStatusCodes.NOT_FOUND)
    }

    // Get professional experience and documents
    const [professionalExperience, documents] = await Promise.all([
      PROFESSIONAL_EXPERIENCE_SERVICES.getByDoctorId(doctor.id),
      DOCUMENTS_SERVICES.getByDoctorId(doctor.id),
    ])

    if (!professionalExperience) {
      throw new HttpError('Professional experience not found', HttpStatusCodes.NOT_FOUND)
    }

    if (!documents) {
      throw new HttpError('Documents not found', HttpStatusCodes.NOT_FOUND)
    }

    return c.json(
      {
        message: 'Doctor profile retrieved successfully',
        success: true,
        data: {
          professionalExperience: formatProfessionalExperienceResponse(professionalExperience),
          documents: formatDocumentsResponse(documents),
        },
      },
      HttpStatusCodes.OK
    )
  },
}

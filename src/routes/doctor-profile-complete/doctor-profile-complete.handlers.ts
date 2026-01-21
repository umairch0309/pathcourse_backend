import * as HttpStatusCodes from 'stoker/http-status-codes'
import { extractS3KeyFromUrl, keysToSignedUrls } from '~/lib/s3'
import { HttpError } from '~/lib/error'
import prisma from '~/lib/prisma'
import type { DOCTOR_PROFILE_COMPLETE_ROUTES } from '~/routes/doctor-profile-complete/doctor-profile-complete.routes'
import { DOCTOR_SERVICES } from '~/services/doctor.service'
import { DOCUMENTS_SERVICES } from '~/services/documents.service'
import { PROFESSIONAL_EXPERIENCE_SERVICES } from '~/services/professional-experience.service'
import { EDUCATION_SERVICES } from '~/services/education.service'
import type { HandlerMapFromRoutes } from '~/types'

// Helper function to convert user image to signed URL
const convertUserImageToSignedUrl = async (
  imageKeyOrUrl: string | null
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

// Helper function to convert documents to signed URLs
const convertDocumentsToSignedUrls = async (documents: {
  id: string
  doctorId: string
  resume: string | null
  medicalLicense: string | null
  introductionVideo: string | null
  createdAt: Date
  updatedAt: Date
} | null) => {
  if (!documents) {
    return null
  }

  const keys = [
    extractS3KeyFromUrl(documents.resume),
    extractS3KeyFromUrl(documents.medicalLicense),
    extractS3KeyFromUrl(documents.introductionVideo),
  ].filter((key): key is string => key !== null)

  if (keys.length === 0) {
    return {
      id: documents.id,
      resume: documents.resume,
      medicalLicense: documents.medicalLicense,
      introductionVideo: documents.introductionVideo,
      createdAt: documents.createdAt,
      updatedAt: documents.updatedAt,
      doctorId: documents.doctorId,
    }
  }

  const signedUrls = await keysToSignedUrls(keys, 7 * 24 * 3600) // 7 days
  const signedUrlsArray = Array.isArray(signedUrls) ? signedUrls : [signedUrls]

  let urlIndex = 0
  return {
    id: documents.id,
    doctorId: documents.doctorId,
    resume: documents.resume ? signedUrlsArray[urlIndex++] || documents.resume : documents.resume,
    medicalLicense: documents.medicalLicense
      ? signedUrlsArray[urlIndex++] || documents.medicalLicense
      : documents.medicalLicense,
    introductionVideo: documents.introductionVideo
      ? signedUrlsArray[urlIndex++] || documents.introductionVideo
      : documents.introductionVideo,
    createdAt: documents.createdAt,
    updatedAt: documents.updatedAt,
  }
}

// Helper function to convert education document URL to signed URL
const convertEducationDocumentToSignedUrl = async (documentUrl: string | null) => {
  if (!documentUrl) {
    return null
  }
  const key = extractS3KeyFromUrl(documentUrl)
  if (!key) {
    return documentUrl
  }
  return keysToSignedUrls(key, 7 * 24 * 3600) // 7 days
}

export const DOCTOR_PROFILE_COMPLETE_ROUTES_HANDLER: HandlerMapFromRoutes<
  typeof DOCTOR_PROFILE_COMPLETE_ROUTES
> = {
  getComplete: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only doctors can access their complete profile
    if (user.role !== 'doctor') {
      throw new HttpError('Only doctors can access this endpoint', HttpStatusCodes.FORBIDDEN)
    }

    try {
      // Get doctor with all related data
      const doctor = await prisma.doctor.findUnique({
        where: { userid: user.id },
        include: {
          user: {
            include: {
              userInfo: true,
            },
          },
          documents: true,
          education: {
            orderBy: { startYear: 'desc' },
          },
          professionalExperience: true,
        },
      })

      if (!doctor) {
        throw new HttpError('Doctor not found', HttpStatusCodes.NOT_FOUND)
      }

      // Convert all URLs to signed URLs
      const userImage = await convertUserImageToSignedUrl(doctor.user.image)
      const documents = await convertDocumentsToSignedUrls(doctor.documents)
      const education = await Promise.all(
        doctor.education.map(async edu => ({
          ...edu,
          document: await convertEducationDocumentToSignedUrl(edu.document),
          startYear: edu.startYear.toISOString(),
          endYear: edu.endYear?.toISOString() || null,
          createdAt: edu.createdAt.toISOString(),
          updatedAt: edu.updatedAt.toISOString(),
        }))
      )

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
          image: userImage,
          role: doctor.user.role,
          isAnonymous: doctor.user.isAnonymous,
          employeeCode: doctor.user.employeeCode,
          userInfo: doctor.user.userInfo
            ? {
                id: doctor.user.userInfo.id,
                userId: doctor.user.userInfo.userId,
                gender: doctor.user.userInfo.gender,
                dateOfBirth: doctor.user.userInfo.dateOfBirth?.toISOString() || null,
                phone: doctor.user.userInfo.phone,
                address: doctor.user.userInfo.address,
                createdAt: doctor.user.userInfo.createdAt.toISOString(),
                updatedAt: doctor.user.userInfo.updatedAt.toISOString(),
              }
            : null,
        },
      }

      const formattedProfessionalExperience = doctor.professionalExperience
        ? {
            id: doctor.professionalExperience.id,
            doctorId: doctor.professionalExperience.doctorId,
            age_group: doctor.professionalExperience.age_group,
            languages: doctor.professionalExperience.languages,
            profession: doctor.professionalExperience.profession,
            special_interest_area: doctor.professionalExperience.special_interest_area,
            createdAt: doctor.professionalExperience.createdAt.toISOString(),
            updatedAt: doctor.professionalExperience.updatedAt.toISOString(),
          }
        : null

      const formattedDocuments = documents
        ? {
            ...documents,
            createdAt: documents.createdAt.toISOString(),
            updatedAt: documents.updatedAt.toISOString(),
          }
        : null

      return c.json(
        {
          message: 'Complete doctor profile retrieved successfully',
          success: true,
          data: {
            doctor: formattedDoctor,
            education,
            professionalExperience: formattedProfessionalExperience,
            documents: formattedDocuments,
          },
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      if (error instanceof HttpError) {
        throw error
      }
      // Log the actual error for debugging
      console.error('Error retrieving complete doctor profile:', error)
      throw new HttpError(
        error instanceof Error
          ? `Failed to retrieve complete doctor profile: ${error.message}`
          : 'Failed to retrieve complete doctor profile',
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  updateProfile: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only doctors can update their profile
    if (user.role !== 'doctor') {
      throw new HttpError('Only doctors can access this endpoint', HttpStatusCodes.FORBIDDEN)
    }

    const body = c.req.valid('json')

    try {
      // Get doctor record
      const doctor = await DOCTOR_SERVICES.getByUserId(user.id)
      if (!doctor) {
        throw new HttpError('Doctor not found', HttpStatusCodes.NOT_FOUND)
      }

      // Update user image if provided
      if (body.image !== undefined) {
        await prisma.user.update({
          where: { id: user.id },
          data: { image: body.image },
        })
      }

      // Update user info if provided
      if (
        body.gender !== undefined ||
        body.dateOfBirth !== undefined ||
        body.phone !== undefined ||
        body.address !== undefined
      ) {
        await prisma.userInfo.upsert({
          where: { userId: user.id },
          update: {
            gender: body.gender,
            dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
            phone: body.phone,
            address: body.address,
          },
          create: {
            userId: user.id,
            gender: body.gender || null,
            dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
            phone: body.phone || null,
            address: body.address || null,
          },
        })
      }

      // Update doctor record
      const updateData: {
        professional_contact?: string
        professional_email?: string
        secondary_contact?: string | null
      } = {}

      if (body.professional_contact !== undefined) {
        updateData.professional_contact = body.professional_contact
      }
      if (body.professional_email !== undefined) {
        updateData.professional_email = body.professional_email
      }
      if (body.secondary_contact !== undefined) {
        updateData.secondary_contact = body.secondary_contact
      }

      const updatedDoctor = await prisma.doctor.update({
        where: { userid: user.id },
        data: updateData,
        include: {
          user: {
            include: {
              userInfo: true,
            },
          },
        },
      })

      // Convert user image to signed URL
      const userImage = await convertUserImageToSignedUrl(updatedDoctor.user.image)

      const formattedDoctor = {
        id: updatedDoctor.id,
        userid: updatedDoctor.userid,
        professional_contact: updatedDoctor.professional_contact,
        professional_email: updatedDoctor.professional_email,
        secondary_contact: updatedDoctor.secondary_contact,
        isAvailable: updatedDoctor.isAvailable,
        isInMeeting: updatedDoctor.isInMeeting,
        createdAt: updatedDoctor.createdAt.toISOString(),
        updatedAt: updatedDoctor.updatedAt.toISOString(),
        user: {
          id: updatedDoctor.user.id,
          name: updatedDoctor.user.name,
          email: updatedDoctor.user.email,
          image: userImage,
          role: updatedDoctor.user.role,
          isAnonymous: updatedDoctor.user.isAnonymous,
          employeeCode: updatedDoctor.user.employeeCode,
          userInfo: updatedDoctor.user.userInfo
            ? {
                id: updatedDoctor.user.userInfo.id,
                userId: updatedDoctor.user.userInfo.userId,
                gender: updatedDoctor.user.userInfo.gender,
                dateOfBirth: updatedDoctor.user.userInfo.dateOfBirth?.toISOString() || null,
                phone: updatedDoctor.user.userInfo.phone,
                address: updatedDoctor.user.userInfo.address,
                createdAt: updatedDoctor.user.userInfo.createdAt.toISOString(),
                updatedAt: updatedDoctor.user.userInfo.updatedAt.toISOString(),
              }
            : null,
        },
      }

      return c.json(
        {
          message: 'Doctor profile updated successfully',
          success: true,
          data: formattedDoctor,
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      if (error instanceof HttpError) {
        throw error
      }
      // Log the actual error for debugging
      console.error('Error updating doctor profile:', error)
      if (error instanceof Error) {
        if (error.message.includes('Unique constraint')) {
          throw new HttpError('Professional email already exists', HttpStatusCodes.BAD_REQUEST)
        }
        throw new HttpError(
          `Failed to update doctor profile: ${error.message}`,
          HttpStatusCodes.INTERNAL_SERVER_ERROR
        )
      }
      throw new HttpError(
        'Failed to update doctor profile',
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  updateProfessionalExperience: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only doctors can update their professional experience
    if (user.role !== 'doctor') {
      throw new HttpError('Only doctors can access this endpoint', HttpStatusCodes.FORBIDDEN)
    }

    const body = c.req.valid('json')

    try {
      // Get doctor record
      const doctor = await DOCTOR_SERVICES.getByUserId(user.id)
      if (!doctor) {
        throw new HttpError('Doctor not found', HttpStatusCodes.NOT_FOUND)
      }

      // Get existing professional experience to preserve values not being updated
      const existing = await PROFESSIONAL_EXPERIENCE_SERVICES.getByDoctorId(doctor.id)

      // If no existing record and no fields provided, throw error
      if (!existing && !body.age_group && !body.languages && !body.profession && !body.special_interest_area) {
        throw new HttpError(
          'Professional experience not found. Please provide at least one field to create it.',
          HttpStatusCodes.NOT_FOUND
        )
      }

      // Build update data - use provided values or existing values
      const updateData = {
        doctorId: doctor.id,
        age_group: body.age_group !== undefined ? body.age_group : existing?.age_group || '',
        languages: body.languages !== undefined ? body.languages : existing?.languages || [],
        profession: body.profession !== undefined ? body.profession : existing?.profession || '',
        special_interest_area:
          body.special_interest_area !== undefined
            ? body.special_interest_area
            : existing?.special_interest_area || '',
      }

      // Update professional experience
      const updatedExperience = await PROFESSIONAL_EXPERIENCE_SERVICES.createOrUpdate(updateData)

      return c.json(
        {
          message: 'Professional experience updated successfully',
          success: true,
          data: {
            id: updatedExperience.id,
            doctorId: updatedExperience.doctorId,
            age_group: updatedExperience.age_group,
            languages: updatedExperience.languages,
            profession: updatedExperience.profession,
            special_interest_area: updatedExperience.special_interest_area,
            createdAt: updatedExperience.createdAt.toISOString(),
            updatedAt: updatedExperience.updatedAt.toISOString(),
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
        'Failed to update professional experience',
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  updateDocuments: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only doctors can update their documents
    if (user.role !== 'doctor') {
      throw new HttpError('Only doctors can access this endpoint', HttpStatusCodes.FORBIDDEN)
    }

    const body = c.req.valid('json')

    try {
      // Get doctor record
      const doctor = await DOCTOR_SERVICES.getByUserId(user.id)
      if (!doctor) {
        throw new HttpError('Doctor not found', HttpStatusCodes.NOT_FOUND)
      }

      // Get existing documents to preserve values not being updated
      const existingDocuments = await DOCUMENTS_SERVICES.getByDoctorId(doctor.id)

      // Update documents
      const updatedDocuments = await DOCUMENTS_SERVICES.createOrUpdate({
        doctorId: doctor.id,
        resume: body.resume !== undefined ? body.resume : existingDocuments?.resume || null,
        medicalLicense:
          body.medicalLicense !== undefined
            ? body.medicalLicense
            : existingDocuments?.medicalLicense || null,
        introductionVideo:
          body.introductionVideo !== undefined
            ? body.introductionVideo
            : existingDocuments?.introductionVideo || null,
      })

      // Convert to signed URLs
      const formattedDocuments = await convertDocumentsToSignedUrls(updatedDocuments)

      return c.json(
        {
          message: 'Documents updated successfully',
          success: true,
          data: formattedDocuments
            ? {
                ...formattedDocuments,
                createdAt: formattedDocuments.createdAt.toISOString(),
                updatedAt: formattedDocuments.updatedAt.toISOString(),
              }
            : null,
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
      throw new HttpError('Failed to update documents', HttpStatusCodes.INTERNAL_SERVER_ERROR)
    }
  },

  addEducation: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only doctors can add education records
    if (user.role !== 'doctor') {
      throw new HttpError('Only doctors can access this endpoint', HttpStatusCodes.FORBIDDEN)
    }

    const body = c.req.valid('json')

    try {
      // Get doctor record
      const doctor = await DOCTOR_SERVICES.getByUserId(user.id)
      if (!doctor) {
        throw new HttpError('Doctor not found', HttpStatusCodes.NOT_FOUND)
      }

      // Create education record using bulkCreate with single item
      const createdEducations = await EDUCATION_SERVICES.bulkCreate({
        doctorId: doctor.id,
        educations: [
          {
            degree: body.degree,
            startYear: new Date(body.startYear),
            endYear: body.endYear ? new Date(body.endYear) : null,
            document: body.document || null,
            institution_name: body.institution_name,
          },
        ],
      })

      const education = createdEducations[0]

      // Convert document to signed URL if present
      const documentSignedUrl = education.document
        ? await convertEducationDocumentToSignedUrl(education.document)
        : null

      return c.json(
        {
          message: 'Education record added successfully',
          success: true,
          data: {
            id: education.id,
            doctorId: education.doctorId,
            degree: education.degree,
            startYear: education.startYear.toISOString(),
            endYear: education.endYear?.toISOString() || null,
            document: documentSignedUrl,
            institution_name: education.institution_name,
            createdAt: education.createdAt.toISOString(),
            updatedAt: education.updatedAt.toISOString(),
          },
        },
        HttpStatusCodes.CREATED
      )
    } catch (error) {
      if (error instanceof HttpError) {
        throw error
      }
      if (error instanceof Error && error.message === 'Doctor not found') {
        throw new HttpError('Doctor not found', HttpStatusCodes.NOT_FOUND)
      }
      throw new HttpError('Failed to add education record', HttpStatusCodes.INTERNAL_SERVER_ERROR)
    }
  },

  deleteEducation: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only doctors can delete education records
    if (user.role !== 'doctor') {
      throw new HttpError('Only doctors can access this endpoint', HttpStatusCodes.FORBIDDEN)
    }

    const { id } = c.req.valid('param')

    try {
      // Get doctor record
      const doctor = await DOCTOR_SERVICES.getByUserId(user.id)
      if (!doctor) {
        throw new HttpError('Doctor not found', HttpStatusCodes.NOT_FOUND)
      }

      // Delete education record
      await EDUCATION_SERVICES.delete({
        id,
        doctorId: doctor.id,
      })

      return c.json(
        {
          message: 'Education record deleted successfully',
          success: true,
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      if (error instanceof HttpError) {
        throw error
      }
      if (error instanceof Error) {
        if (error.message === 'Education not found') {
          throw new HttpError('Education record not found', HttpStatusCodes.NOT_FOUND)
        }
        if (error.message.includes('Unauthorized')) {
          throw new HttpError(
            'Unauthorized: Education does not belong to this doctor',
            HttpStatusCodes.FORBIDDEN
          )
        }
      }
      throw new HttpError('Failed to delete education record', HttpStatusCodes.INTERNAL_SERVER_ERROR)
    }
  },
}


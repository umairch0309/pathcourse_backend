/** biome-ignore-all lint/suspicious/noExplicitAny: complex Prisma query types with dynamic includes */
import type { Prisma } from '@prisma/client'
import * as HttpStatusCodes from 'stoker/http-status-codes'
import { HttpError } from '~/lib/error'
import { PERMISSION_SLUGS, requirePermission } from '~/lib/permission-check'
import { extractS3KeyFromUrl, keysToSignedUrls } from '~/lib/s3'
import type { ADMIN_ROUTES } from '~/routes/admin/admin.routes'
import { APPOINTMENT_SERVICES } from '~/services/appointment.service'
import { DASHBOARD_SERVICES } from '~/services/dashboard.service'
import { DOCTOR_SERVICES } from '~/services/doctor.service'
import { USER_SERVICES } from '~/services/user.service'
import { USER_QUERY_SERVICES } from '~/services/user-query.service'
import type { HandlerMapFromRoutes } from '~/types'

// Helper function to convert user image key to signed URL
const convertUserImageToSignedUrl = async (
  imageKeyOrUrl: string | null
): Promise<string | null> => {
  if (!imageKeyOrUrl) {
    return null
  }
  // If it's already a URL starting with https, return as is
  if (imageKeyOrUrl.startsWith('http://') || imageKeyOrUrl.startsWith('https://')) {
    return imageKeyOrUrl
  }
  // Otherwise, treat it as a key and convert to signed URL
  const key = extractS3KeyFromUrl(imageKeyOrUrl)
  if (!key) {
    return imageKeyOrUrl
  }
  const signedUrl = await keysToSignedUrls(key, 7 * 24 * 3600) // 7 days
  return Array.isArray(signedUrl) ? signedUrl[0] : signedUrl
}

type DoctorWithRelations = Prisma.DoctorGetPayload<{
  include: {
    user: true
    documents: true
    education: true
    professionalExperience: true
  }
}>

const formatDoctorRequestResponse = (doctor: DoctorWithRelations) => ({
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
  education: doctor.education.map(edu => ({
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

type DoctorWithUser = Prisma.DoctorGetPayload<{
  include: {
    user: true
  }
}>

const formatDoctorStatusResponse = (doctor: DoctorWithUser) => ({
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const formatApprovedDoctorResponse = (doctor: any) => ({
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
    phone: doctor.user.phone || null,
    banned: doctor.user.banned,
    banReason: doctor.user.banReason,
    banExpires: doctor.user.banExpires?.toISOString() || null,
    onboardingStage: doctor.user.onboardingStage,
    createdAt: doctor.user.createdAt?.toISOString() || new Date().toISOString(),
  },
  documents: doctor.documents
    ? {
        id: doctor.documents.id,
        resume: doctor.documents.resume,
        medicalLicense: doctor.documents.medicalLicense,
        introductionVideo: doctor.documents.introductionVideo,
      }
    : null,
  education: (doctor.education || []).map(
    (edu: {
      id: string
      degree: string
      institution_name: string
      startYear?: Date
      endYear?: Date | null
      document?: string | null
    }) => ({
      id: edu.id,
      degree: edu.degree,
      institution_name: edu.institution_name,
      startYear: edu.startYear?.toISOString() || new Date().toISOString(),
      endYear: edu.endYear?.toISOString() || null,
      document: edu.document || null,
    })
  ),
  professionalExperience: doctor.professionalExperience
    ? {
        id: doctor.professionalExperience.id,
        profession: doctor.professionalExperience.profession,
        special_interest_area: doctor.professionalExperience.special_interest_area,
        age_group: doctor.professionalExperience.age_group,
        languages: doctor.professionalExperience.languages || [],
      }
    : null,
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const formatBlockDoctorResponse = (doctor: any) => ({
  id: doctor.id,
  userid: doctor.userid,
  professional_contact: doctor.professional_contact,
  professional_email: doctor.professional_email,
  user: {
    id: doctor.user.id,
    name: doctor.user.name,
    email: doctor.user.email,
    image: doctor.user.image,
    role: doctor.user.role,
    phone: doctor.user.phone || null,
    banned: doctor.user.banned,
    banReason: doctor.user.banReason,
    banExpires: doctor.user.banExpires?.toISOString() || null,
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

    // Check permission
    await requirePermission(user.id, PERMISSION_SLUGS.SPECIALISTS_VIEW)

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
          // biome-ignore lint/suspicious/noExplicitAny: service returns complex nested types
          doctors: result.doctors.map((d: any) => formatDoctorRequestResponse(d)),
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

    // Check permission
    await requirePermission(user.id, PERMISSION_SLUGS.SPECIALISTS_ACCEPT_REJECT)

    const { doctorId } = c.req.valid('json')

    try {
      const doctor = await DOCTOR_SERVICES.approveDoctor(doctorId)

      return c.json(
        {
          message: 'Doctor approved successfully',
          success: true,
          // biome-ignore lint/suspicious/noExplicitAny: service returns complex nested types
          data: formatDoctorStatusResponse(doctor as any),
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

    // Check permission
    await requirePermission(user.id, PERMISSION_SLUGS.SPECIALISTS_ACCEPT_REJECT)

    const { doctorId, rejectReason } = c.req.valid('json')

    try {
      const doctor = await DOCTOR_SERVICES.rejectDoctor(doctorId, rejectReason)

      return c.json(
        {
          message: 'Doctor rejected successfully',
          success: true,
          // biome-ignore lint/suspicious/noExplicitAny: service returns complex nested types
          data: formatDoctorStatusResponse(doctor as any),
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

  getApprovedDoctors: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only admins can view approved doctors
    if (user.role !== 'admin') {
      throw new HttpError('Forbidden - Admin only', HttpStatusCodes.FORBIDDEN)
    }

    // Check permission
    await requirePermission(user.id, PERMISSION_SLUGS.SPECIALISTS_VIEW)

    const query = c.req.valid('query')
    const filters = {
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 10,
      search: query.search,
    }

    const result = await DOCTOR_SERVICES.getApprovedDoctors(filters)

    return c.json(
      {
        message: 'Approved doctors retrieved successfully',
        success: true,
        data: {
          // biome-ignore lint/suspicious/noExplicitAny: service returns complex nested types
          doctors: result.doctors.map((d: any) => formatApprovedDoctorResponse(d)),
          pagination: result.pagination,
        },
      },
      HttpStatusCodes.OK
    )
  },

  createDoctor: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only admins can create doctors
    if (user.role !== 'admin') {
      throw new HttpError('Forbidden - Admin only', HttpStatusCodes.FORBIDDEN)
    }

    // Check permission
    await requirePermission(user.id, PERMISSION_SLUGS.SPECIALISTS_ADD)

    const data = c.req.valid('json')

    try {
      const doctor = await DOCTOR_SERVICES.createDoctor({
        name: data.name,
        email: data.email,
        password: data.password,
        professional_email: data.professional_email,
        professional_contact: data.professional_contact,
        secondary_contact: data.secondary_contact || null,
        phone: data.phone || null,
      })

      return c.json(
        {
          message: 'Doctor created successfully',
          success: true,
          // biome-ignore lint/suspicious/noExplicitAny: service returns complex nested types
          data: formatApprovedDoctorResponse(doctor as any),
        },
        HttpStatusCodes.CREATED
      )
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      if (
        errorMessage.includes('already exists') ||
        errorMessage.includes('Email already exists') ||
        errorMessage.includes('Professional email already exists')
      ) {
        throw new HttpError(errorMessage, HttpStatusCodes.CONFLICT)
      }
      throw new HttpError(
        errorMessage || 'Failed to create doctor',
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  blockDoctor: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only admins can block doctors
    if (user.role !== 'admin') {
      throw new HttpError('Forbidden - Admin only', HttpStatusCodes.FORBIDDEN)
    }

    // Check permission
    await requirePermission(user.id, PERMISSION_SLUGS.SPECIALISTS_BLOCK_UNBLOCK)

    const { doctorId } = c.req.valid('param')
    const { banReason } = c.req.valid('json')

    try {
      const doctor = await DOCTOR_SERVICES.blockDoctor(doctorId, banReason || undefined)

      return c.json(
        {
          message: 'Doctor blocked successfully',
          success: true,
          // biome-ignore lint/suspicious/noExplicitAny: service returns complex nested types
          data: formatBlockDoctorResponse(doctor as any),
        },
        HttpStatusCodes.OK
      )
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      if (errorMessage.includes('not found')) {
        throw new HttpError('Doctor not found', HttpStatusCodes.NOT_FOUND)
      }
      throw new HttpError(
        errorMessage || 'Failed to block doctor',
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  unblockDoctor: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only admins can unblock doctors
    if (user.role !== 'admin') {
      throw new HttpError('Forbidden - Admin only', HttpStatusCodes.FORBIDDEN)
    }

    // Check permission
    await requirePermission(user.id, PERMISSION_SLUGS.SPECIALISTS_BLOCK_UNBLOCK)

    const { doctorId } = c.req.valid('param')

    try {
      const doctor = await DOCTOR_SERVICES.unblockDoctor(doctorId)

      return c.json(
        {
          message: 'Doctor unblocked successfully',
          success: true,
          // biome-ignore lint/suspicious/noExplicitAny: service returns complex nested types
          data: formatBlockDoctorResponse(doctor as any),
        },
        HttpStatusCodes.OK
      )
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      if (errorMessage.includes('not found')) {
        throw new HttpError('Doctor not found', HttpStatusCodes.NOT_FOUND)
      }
      throw new HttpError(
        errorMessage || 'Failed to unblock doctor',
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  getAllPatients: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only admins can view patients
    if (user.role !== 'admin') {
      throw new HttpError('Forbidden - Admin only', HttpStatusCodes.FORBIDDEN)
    }

    // Check permission
    await requirePermission(user.id, PERMISSION_SLUGS.USERS_VIEW)

    const query = c.req.valid('query')
    const filters = {
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 10,
      search: query.search,
    }

    const result = await USER_SERVICES.getAllPatients(filters)

    return c.json(
      {
        message: 'Patients retrieved successfully',
        success: true,
        data: {
          patients: result.patients.map(patient => ({
            ...patient,
            createdAt: patient.createdAt.toISOString(),
            updatedAt: patient.updatedAt.toISOString(),
            userInfo: patient.userInfo
              ? {
                  ...patient.userInfo,
                  dateOfBirth: patient.userInfo.dateOfBirth?.toISOString() || null,
                }
              : null,
          })),
          pagination: result.pagination,
        },
      },
      HttpStatusCodes.OK
    )
  },

  getPatientById: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only admins can view patient details
    if (user.role !== 'admin') {
      throw new HttpError('Forbidden - Admin only', HttpStatusCodes.FORBIDDEN)
    }

    const { patientId } = c.req.valid('param')

    try {
      const patient = await USER_SERVICES.getPatientById(patientId)

      if (!patient) {
        throw new HttpError('Patient not found', HttpStatusCodes.NOT_FOUND)
      }

      return c.json(
        {
          message: 'Patient retrieved successfully',
          success: true,
          data: {
            ...patient,
            createdAt: patient.createdAt.toISOString(),
            updatedAt: patient.updatedAt.toISOString(),
            userInfo: patient.userInfo
              ? {
                  ...patient.userInfo,
                  dateOfBirth: patient.userInfo.dateOfBirth?.toISOString() || null,
                }
              : null,
          },
        },
        HttpStatusCodes.OK
      )
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      if (errorMessage.includes('not found')) {
        throw new HttpError('Patient not found', HttpStatusCodes.NOT_FOUND)
      }
      throw new HttpError(
        errorMessage || 'Failed to retrieve patient',
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  getAllUserQueries: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only admins can view all queries
    if (user.role !== 'admin') {
      throw new HttpError('Forbidden - Admin only', HttpStatusCodes.FORBIDDEN)
    }

    // Check permission
    await requirePermission(user.id, PERMISSION_SLUGS.USER_INQUIRIES_VIEW)

    const query = c.req.valid('query')
    const filters = {
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 10,
      search: query.search,
    }

    const result = await USER_QUERY_SERVICES.getAll(filters)

    return c.json(
      {
        message: 'User queries retrieved successfully',
        success: true,
        data: {
          userQueries: result.userQueries.map((q: any) => ({
            id: q.id,
            message: q.message,
            organizationName: q.organizationName,
            organizationEmail: q.organizationEmail,
            name: q.name,
            number: q.number,
            email: q.email,
            userId: q.userId,
            createdAt: q.createdAt.toISOString(),
            updatedAt: q.updatedAt.toISOString(),
            user: q.user
              ? {
                  id: q.user.id,
                  name: q.user.name,
                  email: q.user.email,
                }
              : null,
          })),
          pagination: result.pagination,
        },
      },
      HttpStatusCodes.OK
    )
  },

  getUserQueryById: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only admins can view queries by ID
    if (user.role !== 'admin') {
      throw new HttpError('Forbidden - Admin only', HttpStatusCodes.FORBIDDEN)
    }

    // Check permission
    await requirePermission(user.id, PERMISSION_SLUGS.USER_INQUIRIES_VIEW)

    const { id } = c.req.valid('param')

    const userQuery = await USER_QUERY_SERVICES.getById(id)

    if (!userQuery) {
      throw new HttpError('User query not found', HttpStatusCodes.NOT_FOUND)
    }

    return c.json(
      {
        message: 'User query retrieved successfully',
        success: true,
        data: {
          id: userQuery.id,
          message: userQuery.message,
          organizationName: userQuery.organizationName,
          organizationEmail: userQuery.organizationEmail,
          name: userQuery.name,
          number: userQuery.number,
          email: userQuery.email,
          userId: userQuery.userId,
          createdAt: userQuery.createdAt.toISOString(),
          updatedAt: userQuery.updatedAt.toISOString(),
          user: userQuery.user
            ? {
                id: userQuery.user.id,
                name: userQuery.user.name,
                email: userQuery.user.email,
              }
            : null,
        },
      },
      HttpStatusCodes.OK
    )
  },

  getAllAppointments: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only admins can view all appointments
    if (user.role !== 'admin') {
      throw new HttpError('Forbidden - Admin only', HttpStatusCodes.FORBIDDEN)
    }

    // Check permission
    await requirePermission(user.id, PERMISSION_SLUGS.SESSIONS_VIEW)

    const query = c.req.valid('query')
    const filters = {
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 10,
      status: query.status as 'BOOKED' | 'COMPLETED' | 'NO_SHOW' | undefined,
      doctorId: query.doctorId,
      patientId: query.patientId,
      search: query.search,
    }

    const result = await APPOINTMENT_SERVICES.getAllForAdmin(filters)

    // Format appointments with signed URLs
    const formattedAppointments = await Promise.all(
      result.appointments.map(async (appointment: any) => {
        const doctorImage = await convertUserImageToSignedUrl(appointment.doctor?.image)
        const patientImage = await convertUserImageToSignedUrl(appointment.patient?.image)
        const uploadIdSignedUrl = appointment.uploadId
          ? await convertUserImageToSignedUrl(appointment.uploadId)
          : null

        return {
          id: appointment.id,
          doctorId: appointment.doctorId,
          patientId: appointment.patientId,
          status: appointment.status,
          scheduledAt: appointment.scheduledAt?.toISOString() || null,
          startedAt: appointment.startedAt?.toISOString() || null,
          endedAt: appointment.endedAt?.toISOString() || null,
          createdAt: appointment.createdAt.toISOString(),
          updatedAt: appointment.updatedAt.toISOString(),
          chatroomExpiry: appointment.chatroomExpiry?.toISOString() || null,
          age: appointment.age,
          appointmentFor: appointment.appointmentFor,
          issue: appointment.issue,
          uploadId: uploadIdSignedUrl,
          relationWithPatient: appointment.relationWithPatient,
          patientName: appointment.patientName,
          patientAge: appointment.patientAge,
          doctor: appointment.doctor
            ? {
                ...appointment.doctor,
                image: doctorImage,
              }
            : null,
          patient: appointment.patient
            ? {
                ...appointment.patient,
                image: patientImage,
              }
            : null,
          appointmentNotes: appointment.appointmentNotes
            ? {
                ...appointment.appointmentNotes,
                createdAt: appointment.appointmentNotes.createdAt.toISOString(),
                updatedAt: appointment.appointmentNotes.updatedAt.toISOString(),
              }
            : null,
          sessionReason: appointment.sessionReason
            ? {
                ...appointment.sessionReason,
                createdAt: appointment.sessionReason.createdAt.toISOString(),
                updatedAt: appointment.sessionReason.updatedAt.toISOString(),
              }
            : null,
        }
      })
    )

    return c.json(
      {
        message: 'Appointments retrieved successfully',
        success: true,
        data: {
          appointments: formattedAppointments,
          pagination: result.pagination,
        },
      },
      HttpStatusCodes.OK
    )
  },

  getAppointmentById: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only admins can view appointment details
    if (user.role !== 'admin') {
      throw new HttpError('Forbidden - Admin only', HttpStatusCodes.FORBIDDEN)
    }

    // Check permission
    await requirePermission(user.id, PERMISSION_SLUGS.SESSIONS_VIEW)

    const { id } = c.req.valid('param')

    try {
      const appointment = await APPOINTMENT_SERVICES.getByIdForAdmin(id)

      if (!appointment) {
        throw new HttpError('Appointment not found', HttpStatusCodes.NOT_FOUND)
      }

      // Format appointment with signed URLs
      const doctorImage = await convertUserImageToSignedUrl(appointment.doctor?.image)
      const patientImage = await convertUserImageToSignedUrl(appointment.patient?.image)
      const uploadIdSignedUrl = appointment.uploadId
        ? await convertUserImageToSignedUrl(appointment.uploadId)
        : null

      return c.json(
        {
          message: 'Appointment retrieved successfully',
          success: true,
          data: {
            id: appointment.id,
            doctorId: appointment.doctorId,
            patientId: appointment.patientId,
            status: appointment.status,
            scheduledAt: appointment.scheduledAt?.toISOString() || null,
            startedAt: appointment.startedAt?.toISOString() || null,
            endedAt: appointment.endedAt?.toISOString() || null,
            createdAt: appointment.createdAt.toISOString(),
            updatedAt: appointment.updatedAt.toISOString(),
            chatroomExpiry: appointment.chatroomExpiry?.toISOString() || null,
            age: appointment.age,
            appointmentFor: appointment.appointmentFor,
            issue: appointment.issue,
            uploadId: uploadIdSignedUrl,
            relationWithPatient: appointment.relationWithPatient,
            patientName: appointment.patientName,
            patientAge: appointment.patientAge,
            doctor: appointment.doctor
              ? {
                  ...appointment.doctor,
                  image: doctorImage,
                  createdAt: appointment.doctor.createdAt.toISOString(),
                }
              : null,
            patient: appointment.patient
              ? {
                  ...appointment.patient,
                  image: patientImage,
                  createdAt: appointment.patient.createdAt.toISOString(),
                }
              : null,
            appointmentNotes: appointment.appointmentNotes
              ? {
                  ...appointment.appointmentNotes,
                  createdAt: appointment.appointmentNotes.createdAt.toISOString(),
                  updatedAt: appointment.appointmentNotes.updatedAt.toISOString(),
                }
              : null,
            sessionReason: appointment.sessionReason
              ? {
                  ...appointment.sessionReason,
                  createdAt: appointment.sessionReason.createdAt.toISOString(),
                  updatedAt: appointment.sessionReason.updatedAt.toISOString(),
                }
              : null,
          },
        },
        HttpStatusCodes.OK
      )
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      if (errorMessage.includes('not found')) {
        throw new HttpError('Appointment not found', HttpStatusCodes.NOT_FOUND)
      }
      throw new HttpError(
        errorMessage || 'Failed to retrieve appointment',
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  updateAdminProfile: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only admins can update their profile
    if (user.role !== 'admin') {
      throw new HttpError('Forbidden - Admin only', HttpStatusCodes.FORBIDDEN)
    }

    // Check permission (settings view allows profile updates)
    await requirePermission(user.id, PERMISSION_SLUGS.SETTINGS_VIEW)

    const body = c.req.valid('json')

    try {
      const updatedUser = await USER_SERVICES.updateAdminProfile({
        userId: user.id,
        name: body.name,
        image: body.image,
        phone: body.phone,
      })

      return c.json(
        {
          message: 'Admin profile updated successfully',
          success: true,
          data: {
            ...updatedUser,
            createdAt: updatedUser.createdAt.toISOString(),
            updatedAt: updatedUser.updatedAt.toISOString(),
          },
        },
        HttpStatusCodes.OK
      )
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new HttpError(
        errorMessage || 'Failed to update admin profile',
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  getDashboardStats: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only admins can view dashboard stats
    if (user.role !== 'admin') {
      throw new HttpError('Forbidden - Admin only', HttpStatusCodes.FORBIDDEN)
    }

    // Check permission
    await requirePermission(user.id, PERMISSION_SLUGS.DASHBOARD_VIEW)

    try {
      const stats = await DASHBOARD_SERVICES.getStats()

      return c.json(
        {
          message: 'Dashboard statistics retrieved successfully',
          success: true,
          data: stats,
        },
        HttpStatusCodes.OK
      )
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new HttpError(
        errorMessage || 'Failed to retrieve dashboard statistics',
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  getLastUserQueries: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only admins can view last user queries
    if (user.role !== 'admin') {
      throw new HttpError('Forbidden - Admin only', HttpStatusCodes.FORBIDDEN)
    }

    // Check permission
    await requirePermission(user.id, PERMISSION_SLUGS.DASHBOARD_VIEW)

    const query = c.req.valid('query')
    const limit = query.limit ? parseInt(query.limit, 10) : 5

    try {
      const userQueries = await USER_QUERY_SERVICES.getLastN(limit)

      return c.json(
        {
          message: 'Last user queries retrieved successfully',
          success: true,
          data: {
            userQueries: userQueries.map((q: any) => ({
              id: q.id,
              message: q.message,
              organizationName: q.organizationName,
              organizationEmail: q.organizationEmail,
              name: q.name,
              number: q.number,
              email: q.email,
              userId: q.userId,
              createdAt: q.createdAt.toISOString(),
              updatedAt: q.updatedAt.toISOString(),
              user: q.user
                ? {
                    id: q.user.id,
                    name: q.user.name,
                    email: q.user.email,
                  }
                : null,
            })),
          },
        },
        HttpStatusCodes.OK
      )
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new HttpError(
        errorMessage || 'Failed to retrieve last user queries',
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  getLastAppointments: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only admins can view last appointments
    if (user.role !== 'admin') {
      throw new HttpError('Forbidden - Admin only', HttpStatusCodes.FORBIDDEN)
    }

    // Check permission
    await requirePermission(user.id, PERMISSION_SLUGS.DASHBOARD_VIEW)

    const query = c.req.valid('query')
    const limit = query.limit ? parseInt(query.limit, 10) : 5

    try {
      const appointments = await APPOINTMENT_SERVICES.getLastN(limit)

      // Format appointments with signed URLs
      const formattedAppointments = await Promise.all(
        appointments.map(async (appointment: any) => {
          const doctorImage = await convertUserImageToSignedUrl(appointment.doctor?.image)
          const patientImage = await convertUserImageToSignedUrl(appointment.patient?.image)

          return {
            id: appointment.id,
            doctorId: appointment.doctorId,
            patientId: appointment.patientId,
            status: appointment.status,
            scheduledAt: appointment.scheduledAt?.toISOString() || null,
            startedAt: appointment.startedAt?.toISOString() || null,
            endedAt: appointment.endedAt?.toISOString() || null,
            createdAt: appointment.createdAt.toISOString(),
            updatedAt: appointment.updatedAt.toISOString(),
            appointmentFor: appointment.appointmentFor,
            issue: appointment.issue,
            doctor: appointment.doctor
              ? {
                  ...appointment.doctor,
                  image: doctorImage,
                }
              : null,
            patient: appointment.patient
              ? {
                  ...appointment.patient,
                  image: patientImage,
                }
              : null,
          }
        })
      )

      return c.json(
        {
          message: 'Last appointments retrieved successfully',
          success: true,
          data: {
            appointments: formattedAppointments,
          },
        },
        HttpStatusCodes.OK
      )
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new HttpError(
        errorMessage || 'Failed to retrieve last appointments',
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },
}

import * as HttpStatusCodes from 'stoker/http-status-codes'

import { formatUserForAppointment } from '~/lib/anonymize-user'
import { HttpError } from '~/lib/error'
import { extractS3KeyFromUrl, keysToSignedUrls } from '~/lib/s3'
import type { APPOINTMENT_ROUTES } from '~/routes/appointment/appointment.routes'
import { APPOINTMENT_SERVICES } from '~/services/appointment.service'
import type { HandlerMapFromRoutes } from '~/types'

// Helper function to convert documents to signed URLs
const convertDocumentsToSignedUrls = async (documents: {
  id: string
  resume: string | null
  medicalLicense: string | null
  introductionVideo: string | null
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
    }
  }

  const signedUrls = await keysToSignedUrls(keys, 7 * 24 * 3600) // 7 days
  const signedUrlsArray = Array.isArray(signedUrls) ? signedUrls : [signedUrls]

  let urlIndex = 0
  return {
    id: documents.id,
    resume: documents.resume ? signedUrlsArray[urlIndex++] || documents.resume : documents.resume,
    medicalLicense: documents.medicalLicense
      ? signedUrlsArray[urlIndex++] || documents.medicalLicense
      : documents.medicalLicense,
    introductionVideo: documents.introductionVideo
      ? signedUrlsArray[urlIndex++] || documents.introductionVideo
      : documents.introductionVideo,
  }
}

// Helper function to convert education document URL to signed URL
const convertEducationDocumentToSignedUrl = async (documentUrl: string | null) => {
  if (!documentUrl) {
    return null
  }
  const key = extractS3KeyFromUrl(documentUrl)
  if (!key) {
    return null
  }
  return keysToSignedUrls(key, 7 * 24 * 3600) // 7 days
}

// Helper function to convert user image key to signed URL
const convertUserImageToSignedUrl = async (imageKeyOrUrl: string | null): Promise<string | null> => {
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

// Format full appointment response with complete doctor and patient objects
const formatFullAppointmentResponse = async (appointment: any, currentUserId?: string) => {
  // Check if current user is viewing their own appointment
  const isViewingOwnAppointment = currentUserId && (appointment.doctorId === currentUserId || appointment.patientId === currentUserId)

  // Format doctor with full details
  const doctorUser = appointment.doctor
  const doctorImage = await convertUserImageToSignedUrl(doctorUser.image)

  let doctorDetails = null
  if (doctorUser.doctor) {
    const documents = await convertDocumentsToSignedUrls(doctorUser.doctor.documents)
    const education = await Promise.all(
      (doctorUser.doctor.education || []).map(async (edu: any) => ({
        ...edu,
        document: await convertEducationDocumentToSignedUrl(edu.document),
      }))
    )

    doctorDetails = {
      id: doctorUser.doctor.id,
      userid: doctorUser.doctor.userid,
      professional_contact: doctorUser.doctor.professional_contact,
      professional_email: doctorUser.doctor.professional_email,
      about: doctorUser.doctor.about,
      isAvailable: doctorUser.doctor.isAvailable,
      isInMeeting: doctorUser.doctor.isInMeeting,
      availableDurations: doctorUser.doctor.availableDurations,
      documents,
      education,
      professionalExperience: doctorUser.doctor.professionalExperience || [],
    }
  }

  const formattedDoctor = {
    id: doctorUser.id,
    name: doctorUser.name,
    email: doctorUser.email,
    image: doctorImage,
    role: doctorUser.role,
    isAnonymous: doctorUser.isAnonymous,
    employeeCode: doctorUser.employeeCode,
    userInfo: doctorUser.userInfo,
    doctor: doctorDetails,
  }

  // Format patient with full details
  const patientUser = appointment.patient
  const patientImage = await convertUserImageToSignedUrl(patientUser.image)

  const formattedPatient = {
    id: patientUser.id,
    name: patientUser.name,
    email: patientUser.email,
    image: patientImage,
    role: patientUser.role,
    isAnonymous: patientUser.isAnonymous,
    employeeCode: patientUser.employeeCode,
    userInfo: patientUser.userInfo,
  }

  // Apply anonymization if needed (but keep userInfo for own appointments)
  const finalDoctor = formatUserForAppointment(formattedDoctor, 'doctor', isViewingOwnAppointment && appointment.doctorId === currentUserId)
  const finalPatient = formatUserForAppointment(formattedPatient, 'patient', isViewingOwnAppointment && appointment.patientId === currentUserId)

  // Build base appointment object
  const baseAppointment = {
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
    uploadId: appointment.uploadId,
    relationWithPatient: appointment.relationWithPatient,
    patientName: appointment.patientName,
    patientAge: appointment.patientAge,
  }

  // If viewing own appointment, include full details
  if (isViewingOwnAppointment) {
    if (appointment.doctorId === currentUserId) {
      return {
        ...baseAppointment,
        doctor: formattedDoctor,
        patient: finalPatient,
      }
    } else {
      return {
        ...baseAppointment,
        doctor: finalDoctor,
        patient: formattedPatient,
      }
    }
  }

  return {
    ...baseAppointment,
    doctor: finalDoctor,
    patient: finalPatient,
  }
}

const formatAppointmentResponse = (appointment: any, currentUserId?: string) => {
  // Check if current user is viewing their own appointment
  const isViewingOwnAppointment = currentUserId && (appointment.doctorId === currentUserId || appointment.patientId === currentUserId)

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
    uploadId: appointment.uploadId,
    relationWithPatient: appointment.relationWithPatient,
    patientName: appointment.patientName,
    patientAge: appointment.patientAge,
    doctor: formatUserForAppointment(appointment.doctor, 'doctor', isViewingOwnAppointment && appointment.doctorId === currentUserId),
    patient: formatUserForAppointment(
      appointment.patient,
      'patient',
      isViewingOwnAppointment && appointment.patientId === currentUserId
    ),
  }
}

export const APPOINTMENT_ROUTES_HANDLER: HandlerMapFromRoutes<typeof APPOINTMENT_ROUTES> = {
  create: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    const body = c.req.valid('json')
    const { doctorId, appointmentFor, issue, age, uploadId, scheduledAt, relationWithPatient, patientName, patientAge } =
      body

    try {
      const appointment = await APPOINTMENT_SERVICES.create({
        doctorId,
        patientId: user.id,
        appointmentFor,
        issue,
        age,
        uploadId,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        relationWithPatient,
        patientName,
        patientAge,
      })

      return c.json(
        {
          message: 'Appointment created successfully',
          success: true,
          data: formatAppointmentResponse(appointment, user.id),
        },
        HttpStatusCodes.CREATED
      )
    } catch (error: any) {
      if (error.message === 'Doctor not found') {
        throw new HttpError('Doctor not found', HttpStatusCodes.NOT_FOUND)
      }
      if (error.message === 'Doctor is not available for appointments at this time') {
        throw new HttpError('Doctor is not available for appointments at this time', HttpStatusCodes.BAD_REQUEST)
      }
      if (error.message.includes('required when booking for someone else')) {
        throw new HttpError(error.message, HttpStatusCodes.BAD_REQUEST)
      }
      throw new HttpError(error.message || 'Failed to create appointment', HttpStatusCodes.INTERNAL_SERVER_ERROR)
    }
  },

  getById: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    const { id } = c.req.valid('param')

    try {
      const appointment = await APPOINTMENT_SERVICES.getById(id)

      if (!appointment) {
        throw new HttpError('Appointment not found', HttpStatusCodes.NOT_FOUND)
      }

      // Check if user has access to this appointment (doctor or patient)
      if (appointment.doctorId !== user.id && appointment.patientId !== user.id && user.role !== 'admin') {
        throw new HttpError('Forbidden', HttpStatusCodes.FORBIDDEN)
      }

      return c.json(
        {
          message: 'Appointment retrieved successfully',
          success: true,
          data: formatAppointmentResponse(appointment, user.id),
        },
        HttpStatusCodes.OK
      )
    } catch (error: any) {
      if (error instanceof HttpError) {
        throw error
      }
      throw new HttpError(error.message || 'Failed to retrieve appointment', HttpStatusCodes.INTERNAL_SERVER_ERROR)
    }
  },

  getAll: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    const query = c.req.valid('query')

    // If user is not admin, filter by their role
    const filters: any = {
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 10,
    }

    if (user.role === 'doctor') {
      filters.doctorId = user.id
    } else if (user.role === 'patient') {
      filters.patientId = user.id
    }

    if (query.doctorId) {
      filters.doctorId = query.doctorId
    }

    if (query.patientId) {
      filters.patientId = query.patientId
    }

    if (query.status) {
      filters.status = query.status
    }

    try {
      const result = await APPOINTMENT_SERVICES.getAll(filters)

      return c.json(
        {
          message: 'Appointments retrieved successfully',
          success: true,
          data: {
            appointments: result.appointments.map((apt: any) => formatAppointmentResponse(apt, user.id)),
            pagination: result.pagination,
          },
        },
        HttpStatusCodes.OK
      )
    } catch (error: any) {
      throw new HttpError(error.message || 'Failed to retrieve appointments', HttpStatusCodes.INTERNAL_SERVER_ERROR)
    }
  },

  updateStatus: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    const { id } = c.req.valid('param')
    const { status } = c.req.valid('json')

    try {
      const appointment = await APPOINTMENT_SERVICES.getById(id)

      if (!appointment) {
        throw new HttpError('Appointment not found', HttpStatusCodes.NOT_FOUND)
      }

      // Only doctor or admin can update status
      if (appointment.doctorId !== user.id && user.role !== 'admin') {
        throw new HttpError('Only the doctor or admin can update appointment status', HttpStatusCodes.FORBIDDEN)
      }

      const updatedAppointment = await APPOINTMENT_SERVICES.updateStatus(id, status)

      return c.json(
        {
          message: 'Appointment status updated successfully',
          success: true,
          data: formatAppointmentResponse(updatedAppointment, user.id),
        },
        HttpStatusCodes.OK
      )
    } catch (error: any) {
      if (error instanceof HttpError) {
        throw error
      }
      throw new HttpError(error.message || 'Failed to update appointment status', HttpStatusCodes.INTERNAL_SERVER_ERROR)
    }
  },

  updateStartedAt: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only doctors can update startedAt
    if (user.role !== 'doctor') {
      throw new HttpError('Only doctors can update appointment startedAt', HttpStatusCodes.FORBIDDEN)
    }

    const { id } = c.req.valid('param')
    const body = c.req.valid('json')
    const startedAt = body?.startedAt ? new Date(body.startedAt) : undefined

    try {
      const updatedAppointment = await APPOINTMENT_SERVICES.updateStartedAt(id, user.id, startedAt)

      return c.json(
        {
          message: 'Appointment startedAt updated successfully',
          success: true,
          data: formatAppointmentResponse(updatedAppointment, user.id),
        },
        HttpStatusCodes.OK
      )
    } catch (error: any) {
      if (error instanceof HttpError) {
        throw error
      }

      // Handle specific error messages from service
      if (error.message?.includes('not found')) {
        throw new HttpError('Appointment not found', HttpStatusCodes.NOT_FOUND)
      }
      if (error.message?.includes('permission')) {
        throw new HttpError('Only the doctor can update this appointment', HttpStatusCodes.FORBIDDEN)
      }

      throw new HttpError(
        error.message || 'Failed to update appointment startedAt',
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  markAsCompleted: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    const { id } = c.req.valid('param')

    try {
      const appointment = await APPOINTMENT_SERVICES.getById(id)

      if (!appointment) {
        throw new HttpError('Appointment not found', HttpStatusCodes.NOT_FOUND)
      }

      // Only the assigned doctor can mark appointment as completed
      if (appointment.doctorId !== user.id && user.role !== 'admin') {
        throw new HttpError('Only the doctor can mark appointment as completed', HttpStatusCodes.FORBIDDEN)
      }

      // Check if appointment is already completed
      if (appointment.status === 'COMPLETED') {
        throw new HttpError('Appointment is already marked as completed', HttpStatusCodes.BAD_REQUEST)
      }

      // Mark as completed
      const updatedAppointment = await APPOINTMENT_SERVICES.updateStatus(id, 'COMPLETED')

      return c.json(
        {
          message: 'Appointment marked as completed successfully',
          success: true,
          data: formatAppointmentResponse(updatedAppointment, user.id),
        },
        HttpStatusCodes.OK
      )
    } catch (error: any) {
      if (error instanceof HttpError) {
        throw error
      }
      throw new HttpError(error.message || 'Failed to mark appointment as completed', HttpStatusCodes.INTERNAL_SERVER_ERROR)
    }
  },

  getByIdFull: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    const { id } = c.req.valid('param')

    try {
      const appointment = await APPOINTMENT_SERVICES.getByIdWithFullDetails(id)

      if (!appointment) {
        throw new HttpError('Appointment not found', HttpStatusCodes.NOT_FOUND)
      }

      // Check if user has access to this appointment (doctor or patient)
      if (appointment.doctorId !== user.id && appointment.patientId !== user.id && user.role !== 'admin') {
        throw new HttpError('Forbidden', HttpStatusCodes.FORBIDDEN)
      }

      const formattedAppointment = await formatFullAppointmentResponse(appointment, user.id)

      return c.json(
        {
          message: 'Appointment with full details retrieved successfully',
          success: true,
          data: formattedAppointment,
        },
        HttpStatusCodes.OK
      )
    } catch (error: any) {
      if (error instanceof HttpError) {
        throw error
      }
      throw new HttpError(error.message || 'Failed to retrieve appointment', HttpStatusCodes.INTERNAL_SERVER_ERROR)
    }
  },

  getPatientAppointments: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only patients can access this endpoint
    if (user.role !== 'patient') {
      throw new HttpError('Only patients can access this endpoint', HttpStatusCodes.FORBIDDEN)
    }

    const query = c.req.valid('query')

    const filters = {
      status: query.status as 'BOOKED' | 'COMPLETED' | 'NO_SHOW' | undefined,
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 10,
    }

    try {
      const result = await APPOINTMENT_SERVICES.getPatientAppointments(user.id, filters)

      // Format all appointments with full details
      const formattedAppointments = await Promise.all(
        result.appointments.map((apt: any) => formatFullAppointmentResponse(apt, user.id))
      )

      return c.json(
        {
          message: 'Patient appointments retrieved successfully',
          success: true,
          data: {
            appointments: formattedAppointments,
            pagination: result.pagination,
          },
        },
        HttpStatusCodes.OK
      )
    } catch (error: any) {
      throw new HttpError(error.message || 'Failed to retrieve patient appointments', HttpStatusCodes.INTERNAL_SERVER_ERROR)
    }
  },

  getDoctorAppointments: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only doctors can access this endpoint
    if (user.role !== 'doctor') {
      throw new HttpError('Only doctors can access this endpoint', HttpStatusCodes.FORBIDDEN)
    }

    const query = c.req.valid('query')

    const filters = {
      status: query.status as 'BOOKED' | 'COMPLETED' | 'NO_SHOW' | undefined,
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 10,
    }

    try {
      const result = await APPOINTMENT_SERVICES.getDoctorAppointments(user.id, filters)

      // Format all appointments with full details
      const formattedAppointments = await Promise.all(
        result.appointments.map((apt: any) => formatFullAppointmentResponse(apt, user.id))
      )

      return c.json(
        {
          message: 'Doctor appointments retrieved successfully',
          success: true,
          data: {
            appointments: formattedAppointments,
            pagination: result.pagination,
          },
        },
        HttpStatusCodes.OK
      )
    } catch (error: any) {
      throw new HttpError(error.message || 'Failed to retrieve doctor appointments', HttpStatusCodes.INTERNAL_SERVER_ERROR)
    }
  },

  submitSessionReason: async c => {
    const user = c.get('user')
    if (!user) {
      throw new HttpError('Unauthorized', HttpStatusCodes.UNAUTHORIZED)
    }

    // Only doctors can submit session reasons
    if (user.role !== 'doctor') {
      throw new HttpError('Only doctors can submit session reasons', HttpStatusCodes.FORBIDDEN)
    }

    const { id } = c.req.valid('param')
    const { reason } = c.req.valid('json')

    try {
      const sessionReason = await APPOINTMENT_SERVICES.submitSessionReason({
        appointmentId: id,
        doctorId: user.id,
        reason: reason as 'LETTING_OFF_STEAM' | 'TALKING_THROUGH_STRESS_OR_UNCERTAINTY' | 'NEEDING_PERSPECTIVE_DURING_A_DEMANDING_PERIOD',
      })

      return c.json(
        {
          message: 'Session reason submitted successfully',
          success: true,
          data: {
            id: sessionReason.id,
            appointmentId: sessionReason.appointmentId,
            reason: sessionReason.reason,
            createdAt: sessionReason.createdAt.toISOString(),
            updatedAt: sessionReason.updatedAt.toISOString(),
          },
        },
        HttpStatusCodes.CREATED
      )
    } catch (error: any) {
      if (error instanceof HttpError) {
        throw error
      }

      // Handle specific error messages from service
      if (error.message?.includes('not found')) {
        throw new HttpError('Appointment not found', HttpStatusCodes.NOT_FOUND)
      }
      if (error.message?.includes('permission')) {
        throw new HttpError(
          'Only the doctor can submit session reason for this appointment',
          HttpStatusCodes.FORBIDDEN
        )
      }
      if (error.message?.includes('completed')) {
        throw new HttpError(
          'Session reason can only be submitted for completed appointments',
          HttpStatusCodes.BAD_REQUEST
        )
      }

      throw new HttpError(
        error.message || 'Failed to submit session reason',
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },
}


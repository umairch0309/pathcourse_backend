import * as HttpStatusCodes from 'stoker/http-status-codes'

import { HttpError } from '~/lib/error'
import type { APPOINTMENT_ROUTES } from '~/routes/appointment/appointment.routes'
import { APPOINTMENT_SERVICES } from '~/services/appointment.service'
import type { HandlerMapFromRoutes } from '~/types'

const formatAppointmentResponse = (appointment: any) => ({
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
  doctor: {
    id: appointment.doctor.id,
    name: appointment.doctor.name,
    email: appointment.doctor.email,
    image: appointment.doctor.image,
    role: appointment.doctor.role,
  },
  patient: {
    id: appointment.patient.id,
    name: appointment.patient.name,
    email: appointment.patient.email,
    image: appointment.patient.image,
    role: appointment.patient.role,
  },
})

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
          data: formatAppointmentResponse(appointment),
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
          data: formatAppointmentResponse(appointment),
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
            appointments: result.appointments.map(formatAppointmentResponse),
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
          data: formatAppointmentResponse(updatedAppointment),
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
}


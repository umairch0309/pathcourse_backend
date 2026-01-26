import * as HttpStatusCodes from 'stoker/http-status-codes'
import { HttpError } from '~/lib/error'
import prisma from '~/lib/prisma'

interface ChatroomFilters {
  userId: string
  role: 'doctor' | 'patient'
}

/**
 * Chatroom service - handles chat operations between doctors and patients
 * Uses AppointmentChat model from Prisma
 */
export const CHATROOM_SERVICES = {
  /**
   * Get appointment by ID (used as chatroom)
   */
  async getChatroomById(id: string, userId: string) {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    })

    if (!appointment) {
      throw new HttpError('Appointment not found', HttpStatusCodes.NOT_FOUND)
    }

    // Verify user has access to this appointment
    if (appointment.doctorId !== userId && appointment.patientId !== userId) {
      throw new HttpError('Access denied to this appointment', HttpStatusCodes.FORBIDDEN)
    }

    return {
      id: appointment.id,
      doctorId: appointment.doctorId,
      patientId: appointment.patientId,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
      doctor: appointment.doctor,
      patient: appointment.patient,
    }
  },

  /**
   * Get all appointments for a user (doctor or patient) - used as chatrooms
   */
  async getChatroomsByUserId(filters: ChatroomFilters) {
    const { userId, role } = filters

    const where: {
      doctorId?: string
      patientId?: string
    } = {}

    // Filter by role
    if (role === 'doctor') {
      where.doctorId = userId
    } else if (role === 'patient') {
      where.patientId = userId
    }

    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
          select: {
            content: true,
            messageType: true,
            createdAt: true,
            senderId: true,
          },
        },
      },
    })

    // Transform appointments to match handler's expected format
    const transformedChatrooms = appointments.map(appointment => {
      const lastMessage =
        appointment.messages && appointment.messages.length > 0 ? appointment.messages[0] : null

      return {
        id: appointment.id,
        doctorId: appointment.doctorId,
        patientId: appointment.patientId,
        createdAt: appointment.createdAt,
        updatedAt: appointment.updatedAt,
        lastMessage: lastMessage?.content || null,
        lastMessageAt: lastMessage?.createdAt || null,
        lastMessageType: lastMessage?.messageType || null,
        lastMessageSenderId: lastMessage?.senderId || null,
        doctor: appointment.doctor,
        patient: appointment.patient,
      }
    })

    return {
      chatrooms: transformedChatrooms,
    }
  },

  /**
   * Mark appointment chat as read for a user
   */
  async markChatroomAsRead(appointmentId: string, userId: string) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    })

    if (!appointment) {
      throw new HttpError('Appointment not found', HttpStatusCodes.NOT_FOUND)
    }

    // Verify user has access
    if (appointment.doctorId !== userId && appointment.patientId !== userId) {
      throw new HttpError('Access denied to this appointment', HttpStatusCodes.FORBIDDEN)
    }

    // Mark all unread messages as read
    await prisma.appointmentChat.updateMany({
      where: {
        appointmentId,
        senderId: { not: userId },
        isRead: false,
      },
      data: {
        isRead: true,
      },
    })

    return { message: 'Appointment chat marked as read' }
  },
}

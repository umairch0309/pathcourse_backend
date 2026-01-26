import type { MessageType } from '@prisma/client'
import * as HttpStatusCodes from 'stoker/http-status-codes'
import { HttpError } from '~/lib/error'
import { createNotificationForUser, NOTIFICATION_TYPES } from '~/lib/notification-helper'
import prisma from '~/lib/prisma'

interface SendMessageData {
  appointmentId: string
  senderId: string
  content?: string
  messageType?: MessageType
  fileUrl?: string
  fileName?: string
  fileSize?: number
}

interface GetMessagesFilters {
  appointmentId: string
  userId: string
}

/**
 * Chatroom Messages service - handles message operations using AppointmentChat
 * Only doctors can send messages. Patients can only view messages.
 */
export const CHATROOM_MESSAGE_SERVICES = {
  /**
   * Send a message in an appointment chat
   * Only doctors can send messages. Patients can only view messages.
   */
  async sendMessage(data: SendMessageData) {
    const {
      appointmentId,
      senderId,
      content,
      messageType = 'TEXT',
      fileUrl,
      fileName,
      fileSize,
    } = data

    // Validate message has content
    if (!content && !fileUrl) {
      throw new HttpError('Message must have content or file', HttpStatusCodes.BAD_REQUEST)
    }

    // Verify appointment exists and user has access
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: {
        id: true,
        doctorId: true,
        patientId: true,
        doctor: {
          select: {
            id: true,
            name: true,
          },
        },
        patient: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!appointment) {
      throw new HttpError('Appointment not found', HttpStatusCodes.NOT_FOUND)
    }

    // Verify sender is part of the appointment
    if (appointment.doctorId !== senderId && appointment.patientId !== senderId) {
      throw new HttpError('Access denied to this appointment', HttpStatusCodes.FORBIDDEN)
    }

    // Only doctors can send messages
    if (appointment.doctorId !== senderId) {
      throw new HttpError(
        'Only doctors can send messages. Patients can only view messages.',
        HttpStatusCodes.FORBIDDEN
      )
    }

    // Create message using AppointmentChat
    const message = await prisma.appointmentChat.create({
      data: {
        appointmentId,
        senderId,
        content: content || null,
        messageType,
        fileUrl,
        fileName,
        fileSize,
        isFromDoctor: true, // Always true since only doctors can send
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    })

    // Get recipient info for notification
    const recipientId =
      senderId === appointment.doctorId ? appointment.patientId : appointment.doctorId
    const senderName =
      senderId === appointment.doctorId ? appointment.doctor.name : appointment.patient.name

    // Create notification for recipient
    if (recipientId) {
      const messagePreview = content
        ? content.length > 50
          ? `${content.substring(0, 50)}...`
          : content
        : messageType === 'IMAGE'
          ? 'Sent an image'
          : messageType === 'FILE'
            ? `Sent a file: ${fileName || 'file'}`
            : 'Sent a message'

      const FRONTEND_URL = Bun.env.FRONTEND_URL || 'https://pathcourse.hasseebmayo.com'
      const notificationUrl = `${FRONTEND_URL}/patient/session/${appointmentId}?tab=chat`
      await createNotificationForUser(
        recipientId,
        NOTIFICATION_TYPES.MESSAGE_RECEIVED_APPOINTMENT,
        `${senderName}: ${messagePreview}`,
        appointmentId,
        notificationUrl
      )
    }

    // Return message
    return message
  },

  /**
   * Get messages from an appointment
   */
  async getMessages(filters: GetMessagesFilters) {
    const { appointmentId, userId } = filters

    // Verify appointment exists and user has access
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: {
        id: true,
        doctorId: true,
        patientId: true,
      },
    })

    if (!appointment) {
      throw new HttpError('Appointment not found', HttpStatusCodes.NOT_FOUND)
    }

    // Verify user has access
    if (appointment.doctorId !== userId && appointment.patientId !== userId) {
      throw new HttpError('Access denied to this appointment', HttpStatusCodes.FORBIDDEN)
    }

    const messages = await prisma.appointmentChat.findMany({
      where: { appointmentId },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    })

    return {
      messages: messages.reverse(), // Reverse to show oldest first
    }
  },

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(messageIds: string[], userId: string) {
    if (!messageIds || messageIds.length === 0) {
      return { updated: 0 }
    }

    // Verify user has access to these messages
    const messages = await prisma.appointmentChat.findMany({
      where: {
        id: { in: messageIds },
      },
      include: {
        appointment: {
          select: {
            doctorId: true,
            patientId: true,
          },
        },
      },
    })

    if (messages.length === 0) {
      return { updated: 0 }
    }

    // Verify all messages are from the same appointment
    const appointmentId = messages[0].appointmentId
    const allSameAppointment = messages.every(m => m.appointmentId === appointmentId)

    if (!allSameAppointment) {
      throw new HttpError(
        'All messages must be from the same appointment',
        HttpStatusCodes.BAD_REQUEST
      )
    }

    // Verify user has access to the appointment
    const appointment = messages[0].appointment
    if (appointment.doctorId !== userId && appointment.patientId !== userId) {
      throw new HttpError('Access denied to these messages', HttpStatusCodes.FORBIDDEN)
    }

    // Mark messages as read (only mark messages not sent by the user)
    const result = await prisma.appointmentChat.updateMany({
      where: {
        id: { in: messageIds },
        senderId: { not: userId },
        isRead: false,
      },
      data: {
        isRead: true,
      },
    })

    return { updated: result.count }
  },

  /**
   * Mark messages as delivered
   */
  async markMessagesAsDelivered(messageIds: string[], userId: string) {
    if (!messageIds || messageIds.length === 0) {
      return { updated: 0 }
    }

    // Mark messages as delivered (only mark messages not sent by the user)
    const result = await prisma.appointmentChat.updateMany({
      where: {
        id: { in: messageIds },
        senderId: { not: userId },
        isDelivered: false,
      },
      data: {
        isDelivered: true,
      },
    })

    return { updated: result.count }
  },

  /**
   * Get unread message count for a user in an appointment
   */
  async getUnreadCount(appointmentId: string, userId: string) {
    const count = await prisma.appointmentChat.count({
      where: {
        appointmentId,
        senderId: { not: userId },
        isRead: false,
      },
    })

    return count
  },
}

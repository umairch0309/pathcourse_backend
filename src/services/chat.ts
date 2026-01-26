/** biome-ignore-all lint/suspicious/noExplicitAny: <explanation> */
import { createNotificationForUser, NOTIFICATION_TYPES } from '~/lib/notification-helper'
import prisma from '~/lib/prisma'

type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM'

interface CreateMessageData {
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
  page?: number
  limit?: number
  before?: Date
}

interface MessageResponse {
  id: string
  content: string | null
  messageType: MessageType
  fileUrl: string | null
  fileName: string | null
  fileSize: number | null
  isDelivered: boolean
  isRead: boolean
  createdAt: Date
  updatedAt: Date
  sender: {
    id: string
    name: string
    email: string
    image: string | null
    role: string | null
  }
}

interface PaginatedMessages {
  messages: MessageResponse[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export const CHAT_SERVICES = {
  /**
   * Verify if user has access to appointment chat
   */
  verifyAppointmentAccess: async (appointmentId: string, userId: string): Promise<boolean> => {
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        OR: [{ doctorId: userId }, { patientId: userId }],
      },
    })

    return !!appointment
  },

  /**
   * Create a new chat message
   * Only doctors can send messages. Patients can only view messages.
   */
  createMessage: async (data: CreateMessageData): Promise<MessageResponse> => {
    // Verify appointment access
    const hasAccess = await CHAT_SERVICES.verifyAppointmentAccess(data.appointmentId, data.senderId)
    if (!hasAccess) {
      throw new Error('User does not have access to this appointment')
    }

    // Get appointment to find the other party and verify sender is doctor
    const appointment = await prisma.appointment.findUnique({
      where: { id: data.appointmentId },
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
      throw new Error('Appointment not found')
    }

    // Only doctors can send messages
    if (appointment.doctorId !== data.senderId) {
      throw new Error('Only doctors can send messages. Patients can only view messages.')
    }

    const message = await prisma.appointmentChat.create({
      data: {
        appointmentId: data.appointmentId,
        senderId: data.senderId,
        content: data.content || null,
        messageType: data.messageType || 'TEXT',
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileSize: data.fileSize,
        isFromDoctor: true, // Always true since only doctors can send
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
      },
    })

    // Determine recipient (the other party in the appointment)
    const recipientId =
      data.senderId === appointment.doctorId ? appointment.patientId : appointment.doctorId
    const senderName =
      data.senderId === appointment.doctorId ? appointment.doctor.name : appointment.patient.name

    // Create notification for recipient
    if (recipientId) {
      const messagePreview = data.content
        ? data.content.length > 50
          ? `${data.content.substring(0, 50)}...`
          : data.content
        : data.messageType === 'IMAGE'
          ? 'Sent an image'
          : data.messageType === 'FILE'
            ? `Sent a file: ${data.fileName || 'file'}`
            : 'Sent a message'

      const FRONTEND_URL = Bun.env.FRONTEND_URL || 'https://pathcourse.hasseebmayo.com'
      const notificationUrl = `${FRONTEND_URL}/patient/session/${data.appointmentId}?tab=chat`
      await createNotificationForUser(
        recipientId,
        NOTIFICATION_TYPES.MESSAGE_RECEIVED_APPOINTMENT,
        `${senderName}: ${messagePreview}`,
        data.appointmentId,
        notificationUrl
      )
    }

    return {
      id: message.id,
      content: message.content,
      messageType: message.messageType,
      fileUrl: message.fileUrl,
      fileName: message.fileName,
      fileSize: message.fileSize,
      isDelivered: message.isDelivered,
      isRead: message.isRead,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      sender: message.sender,
    }
  },

  /**
   * Get chat messages for an appointment with pagination
   */
  getMessages: async (filters: GetMessagesFilters, userId: string): Promise<PaginatedMessages> => {
    const { appointmentId, page = 1, limit = 50, before } = filters

    // Verify appointment access
    const hasAccess = await CHAT_SERVICES.verifyAppointmentAccess(appointmentId, userId)
    if (!hasAccess) {
      throw new Error('User does not have access to this appointment')
    }

    const skip = (page - 1) * limit

    // Build where clause
    const whereClause: {
      appointmentId: string
      createdAt?: {
        lt: Date
      }
    } = {
      appointmentId,
    }

    if (before) {
      whereClause.createdAt = {
        lt: before,
      }
    }

    // Get total count
    const total = await prisma.appointmentChat.count({
      where: whereClause,
    })

    // Get messages
    const messages = await prisma.appointmentChat.findMany({
      where: whereClause,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    })

    const totalPages = Math.ceil(total / limit)

    // Format messages
    const formattedMessages = messages.map((message: any) => ({
      id: message.id,
      content: message.content,
      messageType: message.messageType,
      fileUrl: message.fileUrl,
      fileName: message.fileName,
      fileSize: message.fileSize,
      isDelivered: message.isDelivered,
      isRead: message.isRead,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      sender: message.sender,
    }))

    return {
      messages: formattedMessages,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    }
  },

  /**
   * Mark messages as read by a user
   */
  markMessagesAsRead: async (messageIds: string[], userId: string): Promise<void> => {
    await prisma.appointmentChat.updateMany({
      where: {
        id: {
          in: messageIds,
        },
        // Only mark messages as read if user has access to the appointment
        appointment: {
          OR: [{ doctorId: userId }, { patientId: userId }],
        },
      },
      data: {
        isRead: true,
      },
    })
  },

  /**
   * Get unread messages count for a user in an appointment
   */
  getUnreadCount: async (appointmentId: string, userId: string): Promise<number> => {
    // Verify appointment access
    const hasAccess = await CHAT_SERVICES.verifyAppointmentAccess(appointmentId, userId)
    if (!hasAccess) {
      throw new Error('User does not have access to this appointment')
    }

    const count = await prisma.appointmentChat.count({
      where: {
        appointmentId,
        senderId: {
          not: userId, // Don't count own messages
        },
        isRead: false,
      },
    })

    return count
  },

  /**
   * Create or update user session for Socket.IO tracking
   */
  createUserSession: async (
    userId: string,
    appointmentId: string,
    socketId: string
  ): Promise<void> => {
    await prisma.userSession.upsert({
      where: {
        socketId,
      },
      create: {
        userId,
        appointmentId,
        socketId,
        isOnline: true,
        lastSeen: new Date(),
      },
      update: {
        isOnline: true,
        lastSeen: new Date(),
      },
    })
  },

  /**
   * Update user session status
   */
  updateUserSession: async (socketId: string, isOnline: boolean): Promise<void> => {
    await prisma.userSession.updateMany({
      where: {
        socketId,
      },
      data: {
        isOnline,
        lastSeen: new Date(),
      },
    })
  },

  /**
   * Remove user session
   */
  removeUserSession: async (socketId: string): Promise<void> => {
    await prisma.userSession.deleteMany({
      where: {
        socketId,
      },
    })
  },

  /**
   * Get online users in an appointment
   */
  getOnlineUsers: async (
    appointmentId: string
  ): Promise<
    Array<{
      userId: string
      name: string
      role: string | null
      lastSeen: Date
    }>
  > => {
    const sessions = await prisma.userSession.findMany({
      where: {
        appointmentId,
        isOnline: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    })

    return sessions.map((session: any) => ({
      userId: session.userId,
      name: session.user.name,
      role: session.user.role,
      lastSeen: session.lastSeen,
    }))
  },

  /**
   * Check if appointment is active for chat
   */
  isAppointmentChatActive: async (appointmentId: string): Promise<boolean> => {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: {
        status: true,
        chatroomExpiry: true,
      },
    })

    if (!appointment) {
      return false
    }

    // Chat is active if appointment is not canceled and within expiry (if set)
    // Note: AppointmentStatus enum doesn't have CANCELED, checking for other statuses
    if (appointment.status !== 'BOOKED' && appointment.status !== 'COMPLETED') {
      return false
    }

    if (appointment.chatroomExpiry && appointment.chatroomExpiry < new Date()) {
      return false
    }

    return true
  },

  /**
   * Delete old messages (for cleanup)
   */
  deleteOldMessages: async (beforeDate: Date): Promise<number> => {
    const result = await prisma.appointmentChat.deleteMany({
      where: {
        createdAt: {
          lt: beforeDate,
        },
      },
    })

    return result.count
  },

  /**
   * Get message by ID (with permission check)
   */
  getMessageById: async (messageId: string, userId: string): Promise<MessageResponse | null> => {
    const message = await prisma.appointmentChat.findUnique({
      where: { id: messageId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
        appointment: {
          select: {
            doctorId: true,
            patientId: true,
          },
        },
      },
    })

    if (!message) {
      return null
    }

    // Check access
    const hasAccess =
      message.appointment.doctorId === userId || message.appointment.patientId === userId
    if (!hasAccess) {
      throw new Error('User does not have access to this message')
    }

    return {
      id: message.id,
      content: message.content,
      messageType: message.messageType,
      fileUrl: message.fileUrl,
      fileName: message.fileName,
      fileSize: message.fileSize,
      isDelivered: message.isDelivered,
      isRead: message.isRead,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      sender: message.sender,
    }
  },
}

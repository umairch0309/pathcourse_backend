import type { Server, Socket } from 'socket.io'
import { CHAT_SERVICES } from '~/services/chat'

interface ChatSocket extends Socket {
  userId?: string
  appointmentId?: string
  role?: string
}

interface SendMessageData {
  content?: string
  messageType?: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM'
  fileUrl?: string
  fileName?: string
  fileSize?: number
}

interface MarkReadData {
  messageIds: string[]
}

interface JoinRoomData {
  appointmentId: string
  userId: string
  role: string
}

/**
 * Configure chat Socket.IO event handlers
 */
export function configureChatSocket(io: Server) {
  io.on('connection', (socket: ChatSocket) => {
    console.log('Client connected:', socket.id)

    // Handle joining appointment chat room
    socket.on('join-appointment', async (data: JoinRoomData) => {
      console.log('Join appointment data:', data)
      try {
        const { appointmentId, userId, role } = data

        // For now, skip auth check as requested
        // In future, implement proper JWT token validation

        // Verify appointment access
        const hasAccess = await CHAT_SERVICES.verifyAppointmentAccess(appointmentId, userId)
        console.log('Has access:', hasAccess)
        if (!hasAccess) {
          socket.emit('error', { message: 'Access denied to appointment' })
          return
        }

        // Check if appointment chat is active
        const isActive = await CHAT_SERVICES.isAppointmentChatActive(appointmentId)
        if (!isActive) {
          socket.emit('error', { message: 'Chat is not active for this appointment' })
          return
        }

        // Store user info in socket
        socket.userId = userId
        socket.appointmentId = appointmentId
        socket.role = role

        // Join the appointment room
        await socket.join(`appointment-${appointmentId}`)

        // Create user session in database
        await CHAT_SERVICES.createUserSession(userId, appointmentId, socket.id)

        // Send connection success message
        socket.emit('connected', {
          socketId: socket.id,
          appointmentId,
          userId,
          timestamp: new Date().toISOString(),
        })

        // Notify other users that this user joined
        socket.to(`appointment-${appointmentId}`).emit('user-joined', {
          userId,
          role,
          timestamp: new Date().toISOString(),
        })

        // Send current online users
        const onlineUsers = await CHAT_SERVICES.getOnlineUsers(appointmentId)
        socket.emit('online-users', { users: onlineUsers })

        console.log(`User ${userId} joined appointment ${appointmentId}`)
      } catch (error) {
        console.error('Error joining appointment:', error)
        socket.emit('error', { message: 'Failed to join appointment' })
      }
    })

    // Handle sending messages
    socket.on('send-message', async (data: SendMessageData) => {
      try {
        // Only handle if user is in an appointment
        if (!socket.userId || !socket.appointmentId) {
          socket.emit('error', {
            message:
              'User not in any appointment. Please join an appointment first using join-appointment event.',
          })
          return
        }

        // Only doctors can send messages
        if (socket.role !== 'doctor') {
          socket.emit('error', {
            message: 'Only doctors can send messages. Patients can only view messages.',
          })
          return
        }

        // Validate message content
        if (!data.content && !data.fileUrl) {
          socket.emit('error', { message: 'Message must have content or file' })
          return
        }

        // Create message in database
        const savedMessage = await CHAT_SERVICES.createMessage({
          appointmentId: socket.appointmentId,
          senderId: socket.userId,
          content: data.content,
          messageType: data.messageType || 'TEXT',
          fileUrl: data.fileUrl,
          fileName: data.fileName,
          fileSize: data.fileSize,
        })

        // Send message to all users in appointment room
        io.to(`appointment-${socket.appointmentId}`).emit('new-message', savedMessage)
      } catch (error) {
        console.error('Error sending message:', error)
        socket.emit('error', { message: 'Failed to send message' })
      }
    })

    // Handle typing indicators
    socket.on('typing-start', () => {
      if (socket.userId && socket.appointmentId) {
        socket.to(`appointment-${socket.appointmentId}`).emit('user-typing', {
          userId: socket.userId,
          isTyping: true,
          timestamp: new Date().toISOString(),
        })
      }
    })

    socket.on('typing-stop', () => {
      if (socket.userId && socket.appointmentId) {
        socket.to(`appointment-${socket.appointmentId}`).emit('user-stopped-typing', {
          userId: socket.userId,
          isTyping: false,
          timestamp: new Date().toISOString(),
        })
      }
    })

    // Handle marking messages as read
    socket.on('mark-read', async (data: MarkReadData) => {
      try {
        // Only handle if user is in an appointment
        if (!socket.userId || !socket.appointmentId) {
          socket.emit('error', {
            message:
              'User not in any appointment. Please join an appointment first using join-appointment event.',
          })
          return
        }

        if (!data.messageIds || !Array.isArray(data.messageIds)) {
          return
        }

        // Mark messages as read in database
        await CHAT_SERVICES.markMessagesAsRead(data.messageIds, socket.userId)

        // Notify other users about read status
        socket.to(`appointment-${socket.appointmentId}`).emit('messages-read', {
          messageIds: data.messageIds,
          readBy: socket.userId,
          timestamp: new Date().toISOString(),
        })
      } catch (error) {
        console.error('Error marking messages as read:', error)
        socket.emit('error', { message: 'Failed to mark messages as read' })
      }
    })

    // Handle ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() })
    })

    // Handle disconnection
    socket.on('disconnect', async () => {
      try {
        if (socket.userId && socket.appointmentId) {
          // Update user session in database
          await CHAT_SERVICES.updateUserSession(socket.id, false)

          // Notify other users that this user left
          socket.to(`appointment-${socket.appointmentId}`).emit('user-left', {
            userId: socket.userId,
            timestamp: new Date().toISOString(),
          })

          console.log(`User ${socket.userId} disconnected from appointment ${socket.appointmentId}`)
        }
      } catch (error) {
        console.error('Error handling disconnect:', error)
      }
    })

    // Handle errors
    socket.on('error', error => {
      console.error('Socket error:', error)
    })
  })
}

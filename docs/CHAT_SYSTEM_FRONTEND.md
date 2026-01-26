# Chat System Frontend Integration Guide

This document provides comprehensive integration instructions for the Chat System using AppointmentChat.

## Overview

The chat system uses **AppointmentChat** for all messaging functionality. Appointments act as chatrooms where doctors and patients can communicate. Each appointment has its own chat conversation.

### Important Restrictions

⚠️ **CRITICAL**: Only **doctors** can send messages. **Patients** can only view/read messages. This is enforced at both the socket and service levels.

## Base Configuration

### Socket.IO Connection

```typescript
import { io } from 'socket.io-client'

const socket = io('YOUR_SOCKET_SERVER_URL', {
  transports: ['websocket'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
})
```

## Appointment Chat

### 1. Joining an Appointment Chat Room

**Event:** `join-appointment`

**Payload:**
```typescript
{
  appointmentId: string
  userId: string
  role: 'doctor' | 'patient'
}
```

**Example:**
```typescript
socket.emit('join-appointment', {
  appointmentId: 'appt_123',
  userId: 'user_456',
  role: 'doctor' // or 'patient'
})
```

**Success Response:**
```typescript
socket.on('connected', (data) => {
  console.log('Connected to appointment chat:', data)
  // {
  //   socketId: string,
  //   appointmentId: string,
  //   userId: string,
  //   timestamp: string
  // }
})
```

**Error Response:**
```typescript
socket.on('error', (error) => {
  console.error('Error:', error.message)
  // Possible errors:
  // - "Access denied to appointment"
  // - "Chat is not active for this appointment"
  // - "Failed to join appointment"
})
```

### 2. Sending Messages (Doctors Only)

**Event:** `send-message`

**Payload:**
```typescript
{
  content?: string          // Text content (required if no fileUrl)
  messageType?: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM'  // Default: 'TEXT'
  fileUrl?: string          // URL to uploaded file (required if no content)
  fileName?: string         // Name of the file
  fileSize?: number         // Size of the file in bytes
}
```

**Example:**
```typescript
// Text message
socket.emit('send-message', {
  content: 'Hello, how can I help you?',
  messageType: 'TEXT'
})

// Image message
socket.emit('send-message', {
  fileUrl: 'https://example.com/image.jpg',
  fileName: 'image.jpg',
  fileSize: 102400,
  messageType: 'IMAGE'
})

// File message
socket.emit('send-message', {
  fileUrl: 'https://example.com/document.pdf',
  fileName: 'document.pdf',
  fileSize: 204800,
  messageType: 'FILE'
})
```

**Error Response (if patient tries to send):**
```typescript
socket.on('error', (error) => {
  // Error message: "Only doctors can send messages. Patients can only view messages."
})
```

**Success Response:**
```typescript
socket.on('new-message', (message) => {
  console.log('New message received:', message)
  // {
  //   id: string,
  //   appointmentId: string,  // Appointment ID (used for both appointment chat and chatroom)
  //   content: string | null,
  //   messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM',
  //   fileUrl: string | null,
  //   fileName: string | null,
  //   fileSize: number | null,
  //   isDelivered: boolean,
  //   isRead: boolean,
  //   createdAt: string,  // ISO 8601 format
  //   updatedAt: string,  // ISO 8601 format
  //   sender: {
  //     id: string,
  //     name: string,
  //     email: string,
  //     image: string | null,
  //     role: string | null
  //   }
  // }
})
```

### 3. Typing Indicators

**Start Typing:**
```typescript
socket.emit('typing-start')
```

**Stop Typing:**
```typescript
socket.emit('typing-stop')
```

**Receive Typing Events:**
```typescript
socket.on('user-typing', (data) => {
  // {
  //   userId: string,
  //   isTyping: true,
  //   timestamp: string
  // }
})

socket.on('user-stopped-typing', (data) => {
  // {
  //   userId: string,
  //   isTyping: false,
  //   timestamp: string
  // }
})
```

### 4. Marking Messages as Read

**Event:** `mark-read`

**Payload:**
```typescript
{
  messageIds: string[]  // Array of message IDs to mark as read
}
```

**Example:**
```typescript
socket.emit('mark-read', {
  messageIds: ['msg_1', 'msg_2', 'msg_3']
})
```

**Broadcast Response:**
```typescript
socket.on('messages-read', (data) => {
  // {
  //   messageIds: string[],
  //   readBy: string,  // userId who read the messages
  //   timestamp: string
  // }
})
```

### 5. Online Users

**Event:** Automatically sent when joining

**Response:**
```typescript
socket.on('online-users', (data) => {
  // {
  //   users: [
  //     {
  //       userId: string,
  //       name: string,
  //       role: string | null,
  //       lastSeen: string  // ISO 8601 format
  //     }
  //   ]
  // }
})
```

### 6. User Join/Leave Events

```typescript
socket.on('user-joined', (data) => {
  // {
  //   userId: string,
  //   role: string,
  //   timestamp: string
  // }
})

socket.on('user-left', (data) => {
  // {
  //   userId: string,
  //   timestamp: string
  // }
})
```

### 7. Connection Health

```typescript
// Send ping
socket.emit('ping')

// Receive pong
socket.on('pong', (data) => {
  // {
  //   timestamp: string
  // }
})
```

## Chatroom (Appointment-Based Chat)

**Note:** Chatrooms are actually appointments. The `join-chatroom` event uses `appointmentId` to join an appointment's chat room.

### 1. Joining a Chatroom (Appointment)

**Event:** `join-chatroom`

**Payload:**
```typescript
{
  appointmentId: string  // Note: Uses appointmentId, not chatroomId
  userId: string
  role: 'doctor' | 'patient'
}
```

**Example:**
```typescript
socket.emit('join-chatroom', {
  appointmentId: 'appt_123',  // Appointment ID acts as chatroom ID
  userId: 'user_456',
  role: 'doctor' // or 'patient'
})
```

**Success Response:**
```typescript
socket.on('connected', (data) => {
  console.log('Connected to chatroom (appointment):', data)
  // {
  //   socketId: string,
  //   appointmentId: string,  // Note: Returns appointmentId
  //   userId: string,
  //   timestamp: string
  // }
})
```

**Error Response:**
```typescript
socket.on('error', (error) => {
  console.error('Error:', error.message)
  // Possible errors:
  // - "Appointment not found or access denied"
  // - "Chat is not active for this appointment"
  // - "Failed to join chatroom"
})
```

### 2. Sending Messages (Doctors Only)

**Event:** `send-message`

**Payload:** Same as Appointment Chat

**Important:** Only doctors can send messages. Patients will receive an error if they attempt to send.

**Success Response:**
```typescript
socket.on('new-message', (message) => {
  console.log('New message received:', message)
  // {
  //   id: string,
  //   appointmentId: string,  // Note: appointmentId instead of chatroomId
  //   senderId: string,
  //   content: string | null,
  //   messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM',
  //   fileUrl: string | null,
  //   fileName: string | null,
  //   fileSize: number | null,
  //   isDelivered: boolean,
  //   isRead: boolean,
  //   createdAt: string,  // ISO 8601 format
  //   updatedAt: string,  // ISO 8601 format
  //   sender: {
  //     id: string,
  //     name: string,
  //     email: string,
  //     image: string | null
  //   }
  // }
})
```

### 3. Marking Chatroom as Read

**Event:** `mark-read`

**Payload:** None (marks all unread messages in the appointment chat as read)

**Example:**
```typescript
socket.emit('mark-read')
```

**Broadcast Response:**
```typescript
socket.on('chatroom-read', (data) => {
  // {
  //   readBy: string,  // userId who marked as read
  //   timestamp: string
  // }
})
```

### 4. Typing Indicators

Same as Appointment Chat - use `typing-start` and `typing-stop` events.

### 5. Online Users

Same as Appointment Chat - automatically sent when joining.

### 6. User Join/Leave Events

Same as Appointment Chat - use `user-joined` and `user-left` events.

## Complete Example: React Hook

```typescript
import { useEffect, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

interface Message {
  id: string
  content: string | null
  messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM'
  fileUrl: string | null
  fileName: string | null
  fileSize: number | null
  isDelivered: boolean
  isRead: boolean
  createdAt: string
  updatedAt: string
  sender: {
    id: string
    name: string
    email: string
    image: string | null
    role: string | null
  }
}

interface UseChatProps {
  appointmentId?: string  // Used for both appointment chat and chatroom (appointment-based)
  userId: string
  role: 'doctor' | 'patient'
  socketUrl: string
  useChatroom?: boolean  // If true, uses join-chatroom event, otherwise join-appointment
}

export function useChat({
  appointmentId,
  userId,
  role,
  socketUrl,
  useChatroom = false,
}: UseChatProps) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const [onlineUsers, setOnlineUsers] = useState<any[]>([])

  useEffect(() => {
    const newSocket = io(socketUrl, {
      transports: ['websocket'],
      reconnection: true,
    })

    // Connection events
    newSocket.on('connect', () => {
      console.log('Socket connected')
      setIsConnected(true)

      // Join appropriate room
      if (appointmentId) {
        if (useChatroom) {
          newSocket.emit('join-chatroom', {
            appointmentId,  // Note: Uses appointmentId
            userId,
            role,
          })
        } else {
          newSocket.emit('join-appointment', {
            appointmentId,
            userId,
            role,
          })
        }
      }
    })

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected')
      setIsConnected(false)
    })

    newSocket.on('connected', (data) => {
      console.log('Joined chat room:', data)
    })

    // Message events
    newSocket.on('new-message', (message: Message) => {
      setMessages((prev) => [...prev, message])
    })

    // Typing events
    newSocket.on('user-typing', (data) => {
      setTypingUsers((prev) => new Set(prev).add(data.userId))
    })

    newSocket.on('user-stopped-typing', (data) => {
      setTypingUsers((prev) => {
        const newSet = new Set(prev)
        newSet.delete(data.userId)
        return newSet
      })
    })

    // Online users
    newSocket.on('online-users', (data) => {
      setOnlineUsers(data.users)
    })

    // Error handling
    newSocket.on('error', (error) => {
      console.error('Socket error:', error.message)
      // Handle error (show toast, etc.)
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [appointmentId, userId, role, socketUrl, useChatroom])

  const sendMessage = useCallback(
    (content: string, messageType: 'TEXT' | 'IMAGE' | 'FILE' = 'TEXT') => {
      if (!socket || !isConnected) {
        console.error('Socket not connected')
        return
      }

      // Check if user is doctor (only doctors can send)
      if (role !== 'doctor') {
        console.error('Only doctors can send messages')
        return
      }

      socket.emit('send-message', {
        content,
        messageType,
      })
    },
    [socket, isConnected, role]
  )

  const sendFile = useCallback(
    (
      fileUrl: string,
      fileName: string,
      fileSize: number,
      messageType: 'IMAGE' | 'FILE'
    ) => {
      if (!socket || !isConnected) {
        console.error('Socket not connected')
        return
      }

      if (role !== 'doctor') {
        console.error('Only doctors can send messages')
        return
      }

      socket.emit('send-message', {
        fileUrl,
        fileName,
        fileSize,
        messageType,
      })
    },
    [socket, isConnected, role]
  )

  const startTyping = useCallback(() => {
    if (socket && isConnected) {
      socket.emit('typing-start')
    }
  }, [socket, isConnected])

  const stopTyping = useCallback(() => {
    if (socket && isConnected) {
      socket.emit('typing-stop')
    }
  }, [socket, isConnected])

  const markAsRead = useCallback(
    (messageIds?: string[]) => {
      if (socket && isConnected) {
        if (useChatroom) {
          // Chatroom mode: marks all unread messages as read
          socket.emit('mark-read')
        } else {
          // Appointment mode: marks specific messages as read
          socket.emit('mark-read', { messageIds: messageIds || [] })
        }
      }
    },
    [socket, isConnected, useChatroom]
  )

  return {
    socket,
    messages,
    isConnected,
    typingUsers,
    onlineUsers,
    sendMessage,
    sendFile,
    startTyping,
    stopTyping,
    markAsRead,
  }
}
```

## Usage Example

```typescript
function ChatComponent() {
  const { user } = useAuth() // Your auth hook
  const {
    messages,
    isConnected,
    sendMessage,
    startTyping,
    stopTyping,
    typingUsers,
  } = useChat({
    appointmentId: 'appt_123',  // Same ID used for both appointment chat and chatroom
    userId: user.id,
    role: user.role, // 'doctor' or 'patient'
    socketUrl: 'YOUR_SOCKET_SERVER_URL',
    useChatroom: false,  // Set to true to use join-chatroom event instead of join-appointment
  })

  const handleSendMessage = () => {
    if (user.role === 'doctor') {
      sendMessage('Hello!')
    } else {
      // Show error: "Only doctors can send messages"
      alert('Only doctors can send messages')
    }
  }

  return (
    <div>
      <div>
        {messages.map((msg) => (
          <div key={msg.id}>
            <strong>{msg.sender.name}:</strong> {msg.content}
          </div>
        ))}
      </div>
      {user.role === 'doctor' && (
        <input
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSendMessage()
            }
          }}
          onFocus={startTyping}
          onBlur={stopTyping}
        />
      )}
      {typingUsers.size > 0 && <div>Someone is typing...</div>}
    </div>
  )
}
```

## Error Handling

Always listen for error events:

```typescript
socket.on('error', (error) => {
  const errorMessages = {
    'Only doctors can send messages. Patients can only view messages.': {
      type: 'permission',
      message: 'You can only view messages, not send them.',
    },
    'Access denied to appointment': {
      type: 'access',
      message: 'You do not have access to this appointment.',
    },
    'Chat is not active for this appointment': {
      type: 'inactive',
      message: 'This chat is no longer active.',
    },
    'Message must have content or file': {
      type: 'validation',
      message: 'Please provide message content or a file.',
    },
  }

  const errorInfo = errorMessages[error.message] || {
    type: 'unknown',
    message: error.message,
  }

  // Show error to user (toast, alert, etc.)
  showError(errorInfo.message)
})
```

## Notifications

When a doctor sends a message, the patient will automatically receive a notification. The notification will include:
- **Type**: `MESSAGE_RECEIVED_APPOINTMENT` (used for both appointment chat and chatroom since both use appointments)
- **Title**: "New Message"
- **Message**: Preview of the message (first 50 characters)
- **URL**: Link to the appointment details page

Patients should listen for notifications and navigate to the chat when clicked.

## Best Practices

1. **Always check role before showing send button**: Only show the message input for doctors
2. **Handle disconnections gracefully**: Show connection status and attempt reconnection
3. **Implement message queuing**: Queue messages if socket is disconnected and send when reconnected
4. **Optimize typing indicators**: Debounce typing start/stop events
5. **Mark messages as read**: Automatically mark messages as read when user views them
6. **Handle file uploads**: Upload files first, then send the file URL via socket
7. **Error handling**: Always listen for error events and provide user feedback
8. **Connection health**: Implement ping/pong to monitor connection health

## Security Notes

- Only users with access to the appointment can join the chat
- Role-based permissions are enforced at the server level
- Patients cannot send messages (server-side validation)
- All messages are stored in the `AppointmentChat` table

## API Endpoints (REST)

For fetching message history, use the REST API endpoints:

- **Appointment Chat**: `GET /api/appointments/{appointmentId}/messages`
- **Chatroom (Appointment-based)**: `GET /api/appointments/{appointmentId}/messages` (same endpoint)

These endpoints will return messages for authorized users. Note that both appointment chat and chatroom use the same endpoint since they both use the `AppointmentChat` model.

## Important Notes

1. **Unified Model**: Both appointment chat and chatroom functionality use the same `AppointmentChat` model in the database
2. **Appointment ID**: Chatrooms are actually appointments - use `appointmentId` when joining a chatroom
3. **Socket Rooms**: Both use the same room format: `appointment-{appointmentId}`
4. **Events**: The main difference is the join event (`join-appointment` vs `join-chatroom`), but both work with the same appointment
5. **Messages**: All messages are stored in `AppointmentChat` regardless of which event was used to join


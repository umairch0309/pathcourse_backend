# Notification API Documentation

This document provides comprehensive integration instructions for the Notification API endpoints, which allow users (admin, doctor, and patient) to manage their notifications.

## Base URL

All endpoints are prefixed with `/api`:

```
Base URL: https://your-api-domain.com/api
```

## Authentication

All endpoints require authentication via better-auth session. Users can only access their own notifications.

## Notification Types

The `title` field in notifications contains the notification type, which can be used to display appropriate icons in the frontend:

- `DOCTOR_ONBOARDING_REQUEST` - Doctor profile submission pending approval
- `DOCTOR_APPROVED` - Doctor profile approved
- `DOCTOR_REJECTED` - Doctor profile rejected
- `APPOINTMENT_BOOKED` - New appointment booked
- `APPOINTMENT_NO_SHOW` - Appointment marked as no-show
- `APPOINTMENT_COMPLETED` - Appointment completed
- `USER_INQUIRY` - New user inquiry/contact form submission

## Notification Endpoints

### 1. Get All Notifications

Retrieve all notifications for the authenticated user with pagination and optional filtering by read status.

**Endpoint:** `GET /api/notifications`

**Authentication:** Required

**Query Parameters:**
- `page` (string, optional): Page number (default: 1)
- `limit` (string, optional): Items per page (default: 10)
- `isRead` (string, optional): Filter by read status (`true`/`false`), omit for all

**Response (200 OK):**
```json
{
  "message": "Notifications retrieved successfully",
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "clx123...",
        "userId": "clx456...",
        "title": "APPOINTMENT_BOOKED",
        "url": "https://pathcourse.hasseebmayo.com/appointments/clx789...",
        "message": "New appointment booked with John Doe. Click to join the session.",
        "isRead": false,
        "createdAt": "2024-01-15T10:00:00.000Z",
        "updatedAt": "2024-01-15T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    },
    "unreadCount": 5
  }
}
```

**Error Responses:**

- **401 Unauthorized**: Not authenticated

**Example Usage (JavaScript/TypeScript):**
```typescript
async function getNotifications(filters?: {
  page?: number
  limit?: number
  isRead?: boolean
}) {
  const params = new URLSearchParams()
  if (filters?.page) params.append('page', filters.page.toString())
  if (filters?.limit) params.append('limit', filters.limit.toString())
  if (filters?.isRead !== undefined) params.append('isRead', filters.isRead.toString())

  const response = await fetch(`/api/notifications?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      // Include authentication headers (cookies/session)
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to fetch notifications')
  }

  const result = await response.json()
  return result.data
}

// Usage
const notifications = await getNotifications({ page: 1, limit: 10 })
console.log('Unread count:', notifications.unreadCount)
```

---

### 2. Mark Notification as Read

Mark a specific notification as read.

**Endpoint:** `POST /api/notifications/mark-read`

**Authentication:** Required

**Request Body:**
```json
{
  "notificationId": "clx123..."
}
```

**Response (200 OK):**
```json
{
  "message": "Notification marked as read successfully",
  "success": true
}
```

**Error Responses:**

- **401 Unauthorized**: Not authenticated
- **404 Not Found**: Notification not found or doesn't belong to user

**Example Usage (JavaScript/TypeScript):**
```typescript
async function markNotificationAsRead(notificationId: string) {
  const response = await fetch('/api/notifications/mark-read', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Include authentication headers (cookies/session)
    },
    body: JSON.stringify({ notificationId }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to mark notification as read')
  }

  const result = await response.json()
  return result
}
```

---

### 3. Mark All Notifications as Read

Mark all unread notifications as read for the authenticated user.

**Endpoint:** `POST /api/notifications/mark-all-read`

**Authentication:** Required

**Response (200 OK):**
```json
{
  "message": "All notifications marked as read successfully",
  "success": true
}
```

**Error Responses:**

- **401 Unauthorized**: Not authenticated

**Example Usage (JavaScript/TypeScript):**
```typescript
async function markAllNotificationsAsRead() {
  const response = await fetch('/api/notifications/mark-all-read', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Include authentication headers (cookies/session)
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to mark all notifications as read')
  }

  const result = await response.json()
  return result
}
```

---

### 4. Delete Notification

Delete a specific notification.

**Endpoint:** `DELETE /api/notifications/{id}`

**Authentication:** Required

**Path Parameters:**
- `id` (string): Notification ID

**Response (200 OK):**
```json
{
  "message": "Notification deleted successfully",
  "success": true
}
```

**Error Responses:**

- **401 Unauthorized**: Not authenticated
- **404 Not Found**: Notification not found or doesn't belong to user

**Example Usage (JavaScript/TypeScript):**
```typescript
async function deleteNotification(notificationId: string) {
  const response = await fetch(`/api/notifications/${notificationId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      // Include authentication headers (cookies/session)
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to delete notification')
  }

  const result = await response.json()
  return result
}
```

---

### 5. Get Unread Count

Get the count of unread notifications for the authenticated user.

**Endpoint:** `GET /api/notifications/unread-count`

**Authentication:** Required

**Response (200 OK):**
```json
{
  "message": "Unread count retrieved successfully",
  "success": true,
  "data": {
    "unreadCount": 5
  }
}
```

**Error Responses:**

- **401 Unauthorized**: Not authenticated

**Example Usage (JavaScript/TypeScript):**
```typescript
async function getUnreadCount() {
  const response = await fetch('/api/notifications/unread-count', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      // Include authentication headers (cookies/session)
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to get unread count')
  }

  const result = await response.json()
  return result.data.unreadCount
}
```

---

## Notification Flow and Triggers

Notifications are automatically created in the following scenarios:

### 1. Doctor Onboarding Request

**Trigger:** When a doctor submits their profile for admin approval

**Notifications Created:**
- **Doctor**: "Your doctor profile has been submitted and is pending admin approval."
- **All Admins**: "New doctor profile submission from [Doctor Name] is pending approval."

**Type:** `DOCTOR_ONBOARDING_REQUEST`

**URL:** `/admin/doctor-requests` (for admins), `/doctor/dashboard` (for doctors)

---

### 2. Doctor Approved

**Trigger:** When an admin approves a doctor's profile

**Notifications Created:**
- **Doctor**: "Your doctor profile has been approved! You can now start accepting appointments."
- **All Admins**: "Doctor [Doctor Name] has been approved."

**Type:** `DOCTOR_APPROVED`

**URL:** `/doctor/dashboard`

---

### 3. Doctor Rejected

**Trigger:** When an admin rejects a doctor's profile

**Notifications Created:**
- **Doctor**: "Your doctor profile has been rejected. Reason: [Reject Reason]"
- **All Admins**: "Doctor [Doctor Name] has been rejected."

**Type:** `DOCTOR_REJECTED`

**URL:** `/doctor/dashboard`

---

### 4. Appointment Booked

**Trigger:** When a patient books an appointment with a doctor

**Notifications Created:**
- **Doctor**: "New appointment booked with [Patient Name]. Click to join the session."

**Type:** `APPOINTMENT_BOOKED`

**URL:** `/appointments/{appointmentId}`

---

### 5. Appointment No-Show

**Trigger:** When an appointment is marked as no-show (manually or automatically after 20 minutes)

**Notifications Created:**
- **Doctor**: "Appointment with [Patient Name] was marked as no-show."
- **Patient**: "Your appointment with [Doctor Name] was marked as no-show."

**Type:** `APPOINTMENT_NO_SHOW`

**URL:** `/appointments/{appointmentId}`

---

### 6. Appointment Completed

**Trigger:** When an appointment status is updated to COMPLETED

**Notifications Created:**
- **Doctor**: "Appointment with [Patient Name] has been completed."
- **Patient**: "Your appointment with [Doctor Name] has been completed."

**Type:** `APPOINTMENT_COMPLETED`

**URL:** `/appointments/{appointmentId}`

---

### 7. User Inquiry

**Trigger:** When a user submits a contact form/inquiry

**Notifications Created:**
- **All Admins**: "New user inquiry from [Organization Name] ([Organization Email])"

**Type:** `USER_INQUIRY`

**URL:** `/admin/user-queries`

---

## React Component Example

```tsx
import { useState, useEffect } from 'react'

interface Notification {
  id: string
  title: string
  message: string
  url: string | null
  isRead: boolean
  createdAt: string
}

function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const count = await getUnreadCount()
        setUnreadCount(count)
      } catch (error) {
        console.error('Failed to fetch unread count:', error)
      }
    }

    fetchUnreadCount()
    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const data = await getNotifications({ page: 1, limit: 10, isRead: false })
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId)
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, isRead: true } : n))
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const getNotificationIcon = (title: string) => {
    switch (title) {
      case 'DOCTOR_ONBOARDING_REQUEST':
        return '📋'
      case 'DOCTOR_APPROVED':
        return '✅'
      case 'DOCTOR_REJECTED':
        return '❌'
      case 'APPOINTMENT_BOOKED':
        return '📅'
      case 'APPOINTMENT_NO_SHOW':
        return '⏰'
      case 'APPOINTMENT_COMPLETED':
        return '✓'
      case 'USER_INQUIRY':
        return '📧'
      default:
        return '🔔'
    }
  }

  return (
    <div className="notification-bell">
      <button onClick={fetchNotifications} className="bell-button">
        🔔
        {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
      </button>

      {notifications.length > 0 && (
        <div className="notification-dropdown">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
              onClick={() => {
                if (!notification.isRead) {
                  handleMarkAsRead(notification.id)
                }
                if (notification.url) {
                  window.location.href = notification.url
                }
              }}
            >
              <span className="icon">{getNotificationIcon(notification.title)}</span>
              <div className="content">
                <p className="message">{notification.message}</p>
                <span className="time">
                  {new Date(notification.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

---

## Complete Example: Notification Management

```typescript
// Notification service
class NotificationService {
  async getAll(filters?: { page?: number; limit?: number; isRead?: boolean }) {
    const params = new URLSearchParams()
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.isRead !== undefined) params.append('isRead', filters.isRead.toString())

    const response = await fetch(`/api/notifications?${params.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) throw new Error('Failed to fetch notifications')
    const result = await response.json()
    return result.data
  }

  async markAsRead(notificationId: string) {
    const response = await fetch('/api/notifications/mark-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId }),
    })

    if (!response.ok) throw new Error('Failed to mark notification as read')
    return await response.json()
  }

  async markAllAsRead() {
    const response = await fetch('/api/notifications/mark-all-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) throw new Error('Failed to mark all as read')
    return await response.json()
  }

  async delete(notificationId: string) {
    const response = await fetch(`/api/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) throw new Error('Failed to delete notification')
    return await response.json()
  }

  async getUnreadCount() {
    const response = await fetch('/api/notifications/unread-count', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) throw new Error('Failed to get unread count')
    const result = await response.json()
    return result.data.unreadCount
  }
}

// Usage
const notificationService = new NotificationService()

// Get all unread notifications
const unreadNotifications = await notificationService.getAll({ isRead: false })

// Mark a notification as read
await notificationService.markAsRead('notification-id')

// Mark all as read
await notificationService.markAllAsRead()

// Get unread count
const unreadCount = await notificationService.getUnreadCount()
```

---

## Frontend URL Configuration

The frontend URL is configured via the `FRONTEND_URL` environment variable:

```env
FRONTEND_URL=https://pathcourse.hasseebmayo.com
```

This URL is used to generate notification redirect URLs. If not set, it defaults to `https://pathcourse.hasseebmayo.com`.

---

## Security Considerations

1. **User Isolation**: Users can only access their own notifications
2. **Authentication Required**: All endpoints require authentication
3. **URL Validation**: Notification URLs are validated and point to the configured frontend domain
4. **Automatic Cleanup**: Notifications are automatically deleted when a user is deleted (cascade delete)

## Notes

- All datetime fields are returned in ISO 8601 format (UTC)
- Notifications are ordered by creation date (newest first)
- The `url` field can be `null` if no redirect URL is applicable
- Notification types are stored in the `title` field for easy icon mapping
- Unread count is included in the `getAll` response for convenience
- Notifications are created automatically by the system based on various events

## Notification Type Icons (Suggested)

- `DOCTOR_ONBOARDING_REQUEST`: 📋 (clipboard)
- `DOCTOR_APPROVED`: ✅ (checkmark)
- `DOCTOR_REJECTED`: ❌ (cross)
- `APPOINTMENT_BOOKED`: 📅 (calendar)
- `APPOINTMENT_NO_SHOW`: ⏰ (clock)
- `APPOINTMENT_COMPLETED`: ✓ (check)
- `USER_INQUIRY`: 📧 (email)

These icons can be customized based on your frontend design system.


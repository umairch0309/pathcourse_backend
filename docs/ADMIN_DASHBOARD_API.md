# Admin Dashboard API Documentation

This document provides comprehensive integration instructions for the Admin Dashboard API endpoints, including profile management, dashboard statistics, and recent activity feeds.

## Base URL

All endpoints are prefixed with `/api`:

```
Base URL: https://your-api-domain.com/api
```

## Authentication

All endpoints require admin authentication via better-auth session. The user must have the `admin` role.

## Admin Dashboard Endpoints

### 1. Update Admin Profile

Update the authenticated admin's profile information (name, image, phone).

**Endpoint:** `PUT /api/admin/profile`

**Authentication:** Required (Admin only)

**Request Body:**
```json
{
  "name": "Admin User",
  "image": "https://s3-url...",
  "phone": "(321) 123-456"
}
```

**Request Schema:**
- `name` (string, optional): Admin name (1-100 characters)
- `image` (string | null, optional): Profile image URL or S3 key
- `phone` (string | null, optional): Phone number (max 50 characters)

**Response (200 OK):**
```json
{
  "message": "Admin profile updated successfully",
  "success": true,
  "data": {
    "id": "clx123...",
    "name": "Admin User",
    "email": "admin@example.com",
    "image": "https://signed-url...",
    "phone": "(321) 123-456",
    "role": "admin",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Error Responses:**

- **401 Unauthorized**: Not authenticated
- **403 Forbidden**: Not an admin user
- **422 Unprocessable Entity**: Validation error

**Business Logic:**
1. Only updates fields that are provided in the request
2. Converts S3 image keys to signed URLs (valid for 7 days)
3. Updates the `updatedAt` timestamp automatically

**Example Usage (JavaScript/TypeScript):**
```typescript
async function updateAdminProfile(data: {
  name?: string
  image?: string | null
  phone?: string | null
}) {
  const response = await fetch('/api/admin/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      // Include authentication headers (cookies/session)
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to update profile')
  }

  const result = await response.json()
  return result.data
}

// Usage
const updatedProfile = await updateAdminProfile({
  name: 'Admin User',
  phone: '(321) 123-456'
})
```

---

### 2. Get Dashboard Statistics

Retrieve comprehensive dashboard statistics including total approved doctors, patients, user queries, and session metrics for the current month.

**Endpoint:** `GET /api/admin/dashboard/stats`

**Authentication:** Required (Admin only)

**Response (200 OK):**
```json
{
  "message": "Dashboard statistics retrieved successfully",
  "success": true,
  "data": {
    "totalApprovedDoctors": 45,
    "totalPatients": 1250,
    "totalUserQueries": 89,
    "totalSessionsThisMonth": 320,
    "completedSessionsThisMonth": 285
  }
}
```

**Response Schema:**
- `totalApprovedDoctors` (number): Total number of approved doctors (onboardingStage = 'COMPLETED')
- `totalPatients` (number): Total number of patients (role = 'patient')
- `totalUserQueries` (number): Total number of user queries/contact forms
- `totalSessionsThisMonth` (number): Total appointments created this month
- `completedSessionsThisMonth` (number): Completed appointments this month

**Error Responses:**

- **401 Unauthorized**: Not authenticated
- **403 Forbidden**: Not an admin user

**Business Logic:**
1. All statistics are calculated in real-time
2. Monthly statistics are based on the current month (UTC)
3. Approved doctors count includes only doctors with `onboardingStage = 'COMPLETED'`
4. Sessions are counted based on appointment `createdAt` date

**Example Usage (JavaScript/TypeScript):**
```typescript
async function getDashboardStats() {
  const response = await fetch('/api/admin/dashboard/stats', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      // Include authentication headers (cookies/session)
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to fetch dashboard stats')
  }

  const result = await response.json()
  return result.data
}

// Usage
const stats = await getDashboardStats()
console.log('Total Doctors:', stats.totalApprovedDoctors)
console.log('Total Patients:', stats.totalPatients)
console.log('Sessions This Month:', stats.totalSessionsThisMonth)
console.log('Completed This Month:', stats.completedSessionsThisMonth)
```

**Example Usage (React Component):**
```tsx
import { useState, useEffect } from 'react'

function DashboardStats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      try {
        const data = await getDashboardStats()
        setStats(data)
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) return <div>Loading stats...</div>
  if (!stats) return <div>No stats available</div>

  return (
    <div className="dashboard-stats">
      <div className="stat-card">
        <h3>Approved Doctors</h3>
        <p className="stat-value">{stats.totalApprovedDoctors}</p>
      </div>
      <div className="stat-card">
        <h3>Total Patients</h3>
        <p className="stat-value">{stats.totalPatients}</p>
      </div>
      <div className="stat-card">
        <h3>User Queries</h3>
        <p className="stat-value">{stats.totalUserQueries}</p>
      </div>
      <div className="stat-card">
        <h3>Sessions This Month</h3>
        <p className="stat-value">{stats.totalSessionsThisMonth}</p>
      </div>
      <div className="stat-card">
        <h3>Completed This Month</h3>
        <p className="stat-value">{stats.completedSessionsThisMonth}</p>
      </div>
    </div>
  )
}
```

---

### 3. Get Last User Queries

Retrieve the most recent user queries/contact form submissions (default: last 5).

**Endpoint:** `GET /api/admin/dashboard/last-user-queries`

**Authentication:** Required (Admin only)

**Query Parameters:**
- `limit` (string, optional): Number of records to return (default: 5)

**Response (200 OK):**
```json
{
  "message": "Last user queries retrieved successfully",
  "success": true,
  "data": {
    "userQueries": [
      {
        "id": "clx123...",
        "message": "I have a question about your services",
        "organizationName": "Acme Corporation",
        "organizationEmail": "contact@acme.com",
        "name": "",
        "number": "",
        "email": "",
        "userId": null,
        "createdAt": "2024-01-15T10:00:00.000Z",
        "updatedAt": "2024-01-15T10:00:00.000Z",
        "user": null
      }
    ]
  }
}
```

**Response Schema:**
- `userQueries` (array): List of user query objects
  - `id` (string): Query ID
  - `message` (string): Query message
  - `organizationName` (string): Organization name
  - `organizationEmail` (string): Organization email
  - `name` (string): Contact name (legacy field)
  - `number` (string): Contact number (legacy field)
  - `email` (string): Contact email (legacy field)
  - `userId` (string | null): Associated user ID (if logged in)
  - `createdAt` (string): Creation timestamp (ISO 8601)
  - `updatedAt` (string): Last update timestamp (ISO 8601)
  - `user` (object | null): Associated user information (if available)

**Error Responses:**

- **401 Unauthorized**: Not authenticated
- **403 Forbidden**: Not an admin user

**Business Logic:**
1. Returns the most recent queries ordered by creation date (newest first)
2. Includes associated user information if the query was submitted by a logged-in user
3. Default limit is 5, but can be customized via query parameter

**Example Usage (JavaScript/TypeScript):**
```typescript
async function getLastUserQueries(limit?: number) {
  const params = new URLSearchParams()
  if (limit) params.append('limit', limit.toString())

  const response = await fetch(`/api/admin/dashboard/last-user-queries?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      // Include authentication headers (cookies/session)
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to fetch last user queries')
  }

  const result = await response.json()
  return result.data
}

// Usage
const lastQueries = await getLastUserQueries(5)
console.log('Last 5 queries:', lastQueries.userQueries)
```

---

### 4. Get Last Appointments

Retrieve the most recent appointments (default: last 5).

**Endpoint:** `GET /api/admin/dashboard/last-appointments`

**Authentication:** Required (Admin only)

**Query Parameters:**
- `limit` (string, optional): Number of records to return (default: 5)

**Response (200 OK):**
```json
{
  "message": "Last appointments retrieved successfully",
  "success": true,
  "data": {
    "appointments": [
      {
        "id": "clx123...",
        "doctorId": "clx456...",
        "patientId": "clx789...",
        "status": "COMPLETED",
        "scheduledAt": "2024-01-15T10:00:00.000Z",
        "startedAt": "2024-01-15T10:00:05.000Z",
        "endedAt": "2024-01-15T10:30:00.000Z",
        "createdAt": "2024-01-14T08:00:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z",
        "appointmentFor": "self",
        "issue": "Anxiety and stress management",
        "doctor": {
          "id": "clx456...",
          "name": "Dr. Jane Smith",
          "email": "jane.smith@example.com",
          "image": "https://signed-url...",
          "role": "doctor"
        },
        "patient": {
          "id": "clx789...",
          "name": "John Doe",
          "email": "john.doe@example.com",
          "image": "https://signed-url...",
          "role": "patient"
        }
      }
    ]
  }
}
```

**Response Schema:**
- `appointments` (array): List of appointment objects
  - `id` (string): Appointment ID
  - `doctorId` (string): Doctor user ID
  - `patientId` (string): Patient user ID
  - `status` (string): Appointment status (`BOOKED`, `COMPLETED`, `NO_SHOW`)
  - `scheduledAt` (string | null): Scheduled date and time (ISO 8601)
  - `startedAt` (string | null): Actual start time (ISO 8601)
  - `endedAt` (string | null): Actual end time (ISO 8601)
  - `createdAt` (string): Creation timestamp (ISO 8601)
  - `updatedAt` (string): Last update timestamp (ISO 8601)
  - `appointmentFor` (string): Who the appointment is for (`self` or `someone else`)
  - `issue` (string): Issue or reason for appointment
  - `doctor` (object): Doctor information
    - `id` (string): Doctor user ID
    - `name` (string): Doctor name
    - `email` (string): Doctor email
    - `image` (string | null): Doctor profile image (signed S3 URL)
    - `role` (string | null): User role
  - `patient` (object): Patient information (same structure as doctor)

**Error Responses:**

- **401 Unauthorized**: Not authenticated
- **403 Forbidden**: Not an admin user

**Business Logic:**
1. Returns the most recent appointments ordered by creation date (newest first)
2. Includes doctor and patient information with profile images
3. Converts S3 image keys to signed URLs (valid for 7 days)
4. Default limit is 5, but can be customized via query parameter

**Example Usage (JavaScript/TypeScript):**
```typescript
async function getLastAppointments(limit?: number) {
  const params = new URLSearchParams()
  if (limit) params.append('limit', limit.toString())

  const response = await fetch(`/api/admin/dashboard/last-appointments?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      // Include authentication headers (cookies/session)
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to fetch last appointments')
  }

  const result = await response.json()
  return result.data
}

// Usage
const lastAppointments = await getLastAppointments(5)
console.log('Last 5 appointments:', lastAppointments.appointments)
```

---

## Complete Example: Admin Dashboard Workflow

```typescript
// 1. Update admin profile
const updatedProfile = await updateAdminProfile({
  name: 'Admin User',
  phone: '(321) 123-456'
})

// 2. Get dashboard statistics
const stats = await getDashboardStats()
console.log('Dashboard Stats:', {
  doctors: stats.totalApprovedDoctors,
  patients: stats.totalPatients,
  queries: stats.totalUserQueries,
  sessionsThisMonth: stats.totalSessionsThisMonth,
  completedThisMonth: stats.completedSessionsThisMonth
})

// 3. Get last 5 user queries
const lastQueries = await getLastUserQueries(5)
console.log('Recent Queries:', lastQueries.userQueries)

// 4. Get last 5 appointments
const lastAppointments = await getLastAppointments(5)
console.log('Recent Appointments:', lastAppointments.appointments)
```

---

## React Dashboard Component Example

```tsx
import { useState, useEffect } from 'react'

function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [lastQueries, setLastQueries] = useState([])
  const [lastAppointments, setLastAppointments] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true)
      try {
        const [statsData, queriesData, appointmentsData] = await Promise.all([
          getDashboardStats(),
          getLastUserQueries(5),
          getLastAppointments(5),
        ])

        setStats(statsData)
        setLastQueries(queriesData.userQueries)
        setLastAppointments(appointmentsData.appointments)
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) return <div>Loading dashboard...</div>

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>

      {/* Statistics Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Approved Doctors</h3>
            <p>{stats.totalApprovedDoctors}</p>
          </div>
          <div className="stat-card">
            <h3>Total Patients</h3>
            <p>{stats.totalPatients}</p>
          </div>
          <div className="stat-card">
            <h3>User Queries</h3>
            <p>{stats.totalUserQueries}</p>
          </div>
          <div className="stat-card">
            <h3>Sessions This Month</h3>
            <p>{stats.totalSessionsThisMonth}</p>
          </div>
          <div className="stat-card">
            <h3>Completed This Month</h3>
            <p>{stats.completedSessionsThisMonth}</p>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="recent-activity">
        <div className="activity-section">
          <h2>Recent User Queries</h2>
          <ul>
            {lastQueries.map((query) => (
              <li key={query.id}>
                <p><strong>{query.organizationName}</strong></p>
                <p>{query.message.substring(0, 100)}...</p>
                <p>{new Date(query.createdAt).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="activity-section">
          <h2>Recent Appointments</h2>
          <ul>
            {lastAppointments.map((appointment) => (
              <li key={appointment.id}>
                <p>
                  <strong>{appointment.doctor.name}</strong> - {appointment.patient.name}
                </p>
                <p>Status: {appointment.status}</p>
                <p>Issue: {appointment.issue.substring(0, 50)}...</p>
                <p>{new Date(appointment.createdAt).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
```

---

## Related Endpoints

- **Get All Appointments**: `/api/admin/appointments` - Get all appointments with filtering
- **Get All Patients**: `/api/admin/patients` - Get all patients
- **Get All User Queries**: `/api/admin/user-queries` - Get all user queries
- **Get Approved Doctors**: `/api/admin/doctors/approved` - Get all approved doctors

## Security Considerations

1. **Admin-Only Access**: All endpoints require admin authentication and role verification
2. **Image Security**: Profile images are converted to signed S3 URLs valid for 7 days
3. **Real-Time Statistics**: All statistics are calculated in real-time from the database
4. **Monthly Calculations**: Monthly statistics are based on UTC timezone
5. **Data Privacy**: Dashboard data includes sensitive information - ensure proper access controls

## Notes

- All datetime fields are returned in ISO 8601 format (UTC)
- Monthly statistics are calculated based on the current month (server time)
- Image URLs are automatically converted from S3 keys to signed URLs (valid for 7 days)
- The `limit` parameter for last queries and appointments defaults to 5 if not provided
- Statistics are calculated in parallel for optimal performance
- Approved doctors count only includes doctors with `onboardingStage = 'COMPLETED'`

## Field Descriptions

### Dashboard Statistics

- **totalApprovedDoctors**: Count of doctors with `role = 'doctor'` and `onboardingStage = 'COMPLETED'`
- **totalPatients**: Count of users with `role = 'patient'`
- **totalUserQueries**: Total count of all user queries/contact forms
- **totalSessionsThisMonth**: Total appointments created in the current month (based on `createdAt`)
- **completedSessionsThisMonth**: Appointments with `status = 'COMPLETED'` created in the current month

### Profile Update Fields

- **name**: Admin's display name (1-100 characters)
- **image**: Profile image URL or S3 key (will be converted to signed URL)
- **phone**: Contact phone number (max 50 characters)

## Error Handling Best Practices

```typescript
async function safeGetDashboardStats() {
  try {
    const stats = await getDashboardStats()
    return { success: true, data: stats }
  } catch (error) {
    if (error.message.includes('Forbidden')) {
      return { success: false, error: 'UNAUTHORIZED' }
    }
    return { success: false, error: 'UNKNOWN_ERROR', message: error.message }
  }
}
```


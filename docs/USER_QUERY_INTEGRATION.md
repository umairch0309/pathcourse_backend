# Frontend Integration Guide - User Query API

This document provides comprehensive integration instructions for the User Query API endpoints.

## Base URL

All endpoints are prefixed with `/api`:

```
Base URL: https://your-api-domain.com/api
```

## Authentication

- **Create endpoint**: Public (no authentication required)
- **Read/Delete endpoints**: Admin authentication required

## User Query Endpoints

### 1. Create User Query (Public)

Submit a new user query/contact form. This endpoint is public and does not require authentication.

**Endpoint:** `POST /api/user-queries`

**Authentication:** Not required (public endpoint)

**Request Body:**
```json
{
  "message": "I have a question about your services",
  "name": "John Doe",
  "number": "+1234567890",
  "email": "john.doe@example.com"
}
```

**Response:**
```json
{
  "message": "User query created successfully",
  "success": true,
  "data": {
    "id": "clx123...",
    "message": "I have a question about your services",
    "name": "John Doe",
    "number": "+1234567890",
    "email": "john.doe@example.com",
    "userId": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "user": null
  }
}
```

**Note:** If a user is logged in when submitting the query, the `userId` will be automatically associated with their account.

**Example Usage (JavaScript/TypeScript):**
```typescript
async function createUserQuery(data: {
  message: string
  name: string
  number: string
  email: string
}) {
  const response = await fetch('/api/user-queries', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to submit query')
  }

  const result = await response.json()
  return result.data
}
```

**Example Usage (React Component):**
```tsx
import { useState } from 'react'

export default function ContactForm() {
  const [formData, setFormData] = useState({
    message: '',
    name: '',
    number: '',
    email: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)

    try {
      const response = await fetch('/api/user-queries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setSuccess(true)
        setFormData({ message: '', name: '', number: '', email: '' })
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to submit query')
      }
    } catch (error) {
      alert('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Name"
        value={formData.name}
        onChange={e => setFormData({ ...formData, name: e.target.value })}
        required
      />
      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={e => setFormData({ ...formData, email: e.target.value })}
        required
      />
      <input
        type="tel"
        placeholder="Phone Number"
        value={formData.number}
        onChange={e => setFormData({ ...formData, number: e.target.value })}
        required
      />
      <textarea
        placeholder="Your message"
        value={formData.message}
        onChange={e => setFormData({ ...formData, message: e.target.value })}
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit Query'}
      </button>
      {success && <p>Query submitted successfully!</p>}
    </form>
  )
}
```

---

### 2. Get All User Queries (Admin Only)

Retrieve all user queries with pagination and search functionality.

**Endpoint:** `GET /api/user-queries`

**Authentication:** Required (Admin role)

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search term for name, email, number, or message

**Response:**
```json
{
  "message": "User queries retrieved successfully",
  "success": true,
  "data": {
    "userQueries": [
      {
        "id": "clx123...",
        "message": "I have a question about your services",
        "name": "John Doe",
        "number": "+1234567890",
        "email": "john.doe@example.com",
        "userId": "user123...",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "user": {
          "id": "user123...",
          "name": "John Doe",
          "email": "john.doe@example.com"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

**Example Usage:**
```typescript
async function getAllUserQueries(filters?: {
  page?: number
  limit?: number
  search?: string
}) {
  const params = new URLSearchParams()
  if (filters?.page) params.append('page', filters.page.toString())
  if (filters?.limit) params.append('limit', filters.limit.toString())
  if (filters?.search) params.append('search', filters.search)

  const response = await fetch(`/api/user-queries?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies for session
  })

  if (!response.ok) {
    throw new Error('Failed to fetch queries')
  }

  const data = await response.json()
  return data.data
}
```

---

### 3. Get User Query by ID (Admin Only)

Retrieve a specific user query by its ID.

**Endpoint:** `GET /api/user-queries/{id}`

**Authentication:** Required (Admin role)

**Path Parameters:**
- `id` (string): User query ID

**Response:**
```json
{
  "message": "User query retrieved successfully",
  "success": true,
  "data": {
    "id": "clx123...",
    "message": "I have a question about your services",
    "name": "John Doe",
    "number": "+1234567890",
    "email": "john.doe@example.com",
    "userId": "user123...",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "user": {
      "id": "user123...",
      "name": "John Doe",
      "email": "john.doe@example.com"
    }
  }
}
```

**Example Usage:**
```typescript
async function getUserQueryById(id: string) {
  const response = await fetch(`/api/user-queries/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  })

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Query not found')
    }
    throw new Error('Failed to fetch query')
  }

  const data = await response.json()
  return data.data
}
```

---

### 4. Delete User Query (Admin Only)

Delete a user query by its ID.

**Endpoint:** `DELETE /api/user-queries/{id}`

**Authentication:** Required (Admin role)

**Path Parameters:**
- `id` (string): User query ID

**Response:**
```json
{
  "message": "User query deleted successfully",
  "success": true
}
```

**Example Usage:**
```typescript
async function deleteUserQuery(id: string) {
  const response = await fetch(`/api/user-queries/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  })

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Query not found')
    }
    throw new Error('Failed to delete query')
  }

  const data = await response.json()
  return data
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "message": "Invalid request data",
  "success": false
}
```

### 401 Unauthorized
```json
{
  "message": "Unauthorized",
  "success": false
}
```

### 403 Forbidden
```json
{
  "message": "Forbidden - Admin only",
  "success": false
}
```

### 404 Not Found
```json
{
  "message": "User query not found",
  "success": false
}
```

### 422 Unprocessable Entity
```json
{
  "message": "Validation error",
  "success": false,
  "errors": {
    "email": ["Invalid email format"],
    "message": ["Message is required"]
  }
}
```

---

## React/Next.js Integration Examples

### Custom Hook for User Queries

```typescript
// hooks/useUserQueries.ts
import { useState, useEffect } from 'react'

interface UserQuery {
  id: string
  message: string
  name: string
  number: string
  email: string
  userId: string | null
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    email: string
  } | null
}

interface UseUserQueriesReturn {
  queries: UserQuery[]
  loading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  refetch: () => Promise<void>
  deleteQuery: (id: string) => Promise<void>
}

export function useUserQueries(filters?: {
  page?: number
  limit?: number
  search?: string
}): UseUserQueriesReturn {
  const [queries, setQueries] = useState<UserQuery[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })

  const fetchQueries = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (filters?.page) params.append('page', filters.page.toString())
      if (filters?.limit) params.append('limit', filters.limit.toString())
      if (filters?.search) params.append('search', filters.search)

      const response = await fetch(`/api/user-queries?${params.toString()}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch queries')
      }

      const data = await response.json()
      setQueries(data.data.userQueries)
      setPagination(data.data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const deleteQuery = async (id: string) => {
    try {
      const response = await fetch(`/api/user-queries/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to delete query')
      }

      // Refetch queries after deletion
      await fetchQueries()
    } catch (err) {
      throw err
    }
  }

  useEffect(() => {
    fetchQueries()
  }, [filters?.page, filters?.limit, filters?.search])

  return {
    queries,
    loading,
    error,
    pagination,
    refetch: fetchQueries,
    deleteQuery,
  }
}
```

### Admin Dashboard Component

```tsx
// components/AdminQueriesDashboard.tsx
import { useState } from 'react'
import { useUserQueries } from '@/hooks/useUserQueries'

export default function AdminQueriesDashboard() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const { queries, loading, error, pagination, deleteQuery } = useUserQueries({
    page,
    limit: 10,
    search: search || undefined,
  })

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this query?')) {
      try {
        await deleteQuery(id)
      } catch (err) {
        alert('Failed to delete query')
      }
    }
  }

  if (loading) return <div>Loading queries...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <h1>User Queries</h1>

      <input
        type="text"
        placeholder="Search queries..."
        value={search}
        onChange={e => {
          setSearch(e.target.value)
          setPage(1)
        }}
      />

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Number</th>
            <th>Message</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {queries.map(query => (
            <tr key={query.id}>
              <td>{query.name}</td>
              <td>{query.email}</td>
              <td>{query.number}</td>
              <td>{query.message.substring(0, 50)}...</td>
              <td>{new Date(query.createdAt).toLocaleDateString()}</td>
              <td>
                <button onClick={() => handleDelete(query.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div>
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </button>
        <span>
          Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
        </span>
        <button
          disabled={page >= pagination.totalPages}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  )
}
```

### Contact Form Component (Public)

```tsx
// components/ContactForm.tsx
import { useState } from 'react'

export default function ContactForm() {
  const [formData, setFormData] = useState({
    message: '',
    name: '',
    number: '',
    email: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/user-queries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setFormData({ message: '', name: '', number: '', email: '' })
      } else {
        setError(data.message || 'Failed to submit query')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="contact-form">
      <h2>Contact Us</h2>

      {success && (
        <div className="success-message">
          Thank you! Your query has been submitted successfully.
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="name">Name *</label>
        <input
          id="name"
          type="text"
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          required
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="email">Email *</label>
        <input
          id="email"
          type="email"
          value={formData.email}
          onChange={e => setFormData({ ...formData, email: e.target.value })}
          required
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="number">Phone Number *</label>
        <input
          id="number"
          type="tel"
          value={formData.number}
          onChange={e => setFormData({ ...formData, number: e.target.value })}
          required
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="message">Message *</label>
        <textarea
          id="message"
          value={formData.message}
          onChange={e => setFormData({ ...formData, message: e.target.value })}
          required
          rows={5}
          disabled={loading}
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit Query'}
      </button>
    </form>
  )
}
```

---

## TypeScript Types

```typescript
// types/user-query.ts
export interface UserQuery {
  id: string
  message: string
  name: string
  number: string
  email: string
  userId: string | null
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    email: string
  } | null
}

export interface CreateUserQueryInput {
  message: string
  name: string
  number: string
  email: string
}

export interface UserQueryListResponse {
  userQueries: UserQuery[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface UserQueryFilters {
  page?: number
  limit?: number
  search?: string
}
```

---

## Notes

1. **Public Endpoint**: The create endpoint is public and does not require authentication. However, if a user is logged in, their query will be automatically associated with their account.

2. **Admin Access**: All read and delete operations require admin authentication. Ensure your admin users have the `role: 'admin'` in their user profile.

3. **Pagination**: The list endpoint supports pagination with configurable page size. Default is 10 items per page.

4. **Search**: The search functionality searches across name, email, number, and message fields (case-insensitive).

5. **User Association**: If a logged-in user submits a query, the `userId` field will be populated and the `user` object will be included in responses.

6. **Error Handling**: Always handle errors appropriately in your frontend code. The API returns descriptive error messages that can be displayed to users.

---

## Best Practices

1. **Form Validation**: Validate form inputs on the client side before submission to provide immediate feedback.

2. **Loading States**: Show loading indicators during API calls to improve user experience.

3. **Success Feedback**: Display success messages after successful submissions.

4. **Error Handling**: Handle network errors and API errors gracefully with user-friendly messages.

5. **Rate Limiting**: Consider implementing rate limiting on the frontend to prevent spam submissions.

6. **Accessibility**: Ensure forms are accessible with proper labels and ARIA attributes.


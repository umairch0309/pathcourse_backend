# Enterprise API Documentation

This document provides comprehensive integration instructions for the Enterprise API endpoints. All endpoints are **admin-only** and require authentication.

## Base URL

All endpoints are prefixed with `/api`:

```
Base URL: https://your-api-domain.com/api
```

## Authentication

- **All endpoints**: Admin authentication required
- Users must have `role: "admin"` to access these endpoints
- Authentication is handled via better-auth session cookies

## Enterprise Endpoints

### 1. Create Enterprise

Create a new enterprise with manual or auto-generated code.

**Endpoint:** `POST /api/enterprises`

**Authentication:** Required (Admin only)

**Request Body:**
```json
{
  "name": "Acme Corporation",
  "code": "ACME01",
  "sessionsPerMonth": 50,
  "generateCode": false
}
```

**Request Schema:**
- `name` (string, required): Enterprise name (1-200 characters)
- `code` (string, optional): Enterprise code (1-50 characters). If not provided and `generateCode` is true, code will be auto-generated
- `sessionsPerMonth` (number, required): Number of sessions allowed per month (minimum: 0)
- `generateCode` (boolean, optional, default: false): If true, automatically generate code from enterprise name

**Code Generation:**
- When `generateCode: true` or `code` is not provided, the system generates a 6-character code from the enterprise name
- Format: First 3 letters (uppercase) + 3 random numbers
- Example: "Acme Corporation" → "ACM123"
- The system ensures uniqueness by checking existing codes

**Response (201 Created):**
```json
{
  "message": "Enterprise created successfully",
  "success": true,
  "data": {
    "id": "clx123...",
    "name": "Acme Corporation",
    "code": "ACME01",
    "sessionsPerMonth": 50,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**

- **400 Bad Request**: Enterprise name or code already exists
  ```json
  {
    "message": "Enterprise name already exists",
    "success": false
  }
  ```
  or
  ```json
  {
    "message": "Enterprise code already exists",
    "success": false
  }
  ```

- **401 Unauthorized**: Not authenticated
  ```json
  {
    "message": "Unauthorized",
    "success": false
  }
  ```

- **403 Forbidden**: Not an admin
  ```json
  {
    "message": "Forbidden - Admin only",
    "success": false
  }
  ```

- **422 Unprocessable Entity**: Validation error
  ```json
  {
    "message": "Validation failed",
    "errors": {
      "name": "Name is required",
      "sessionsPerMonth": "Sessions per month must be a positive number"
    }
  }
  ```

**Example Usage (Manual Code):**
```typescript
async function createEnterprise(data: {
  name: string
  code: string
  sessionsPerMonth: number
}) {
  const response = await fetch('/api/enterprises', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Include authentication cookie
    },
    credentials: 'include',
    body: JSON.stringify({
      ...data,
      generateCode: false,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to create enterprise')
  }

  const result = await response.json()
  return result.data
}

// Usage
const enterprise = await createEnterprise({
  name: 'Acme Corporation',
  code: 'ACME01',
  sessionsPerMonth: 50,
})
```

**Example Usage (Auto-Generated Code):**
```typescript
async function createEnterpriseWithGeneratedCode(data: {
  name: string
  sessionsPerMonth: number
}) {
  const response = await fetch('/api/enterprises', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      ...data,
      generateCode: true, // Auto-generate code from name
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to create enterprise')
  }

  const result = await response.json()
  return result.data
}

// Usage - Code will be auto-generated (e.g., "ACM123")
const enterprise = await createEnterpriseWithGeneratedCode({
  name: 'Acme Corporation',
  sessionsPerMonth: 50,
})

console.log('Generated Code:', enterprise.code) // e.g., "ACM123"
```

### 2. Get All Enterprises

Retrieve all enterprises with pagination and optional search.

**Endpoint:** `GET /api/enterprises`

**Authentication:** Required (Admin only)

**Query Parameters:**
- `page` (string, optional): Page number (default: 1)
- `limit` (string, optional): Items per page (default: 10)
- `search` (string, optional): Search by name or code (case-insensitive)

**Response (200 OK):**
```json
{
  "message": "Enterprises retrieved successfully",
  "success": true,
  "data": {
    "enterprises": [
      {
        "id": "clx123...",
        "name": "Acme Corporation",
        "code": "ACME01",
        "sessionsPerMonth": 50,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
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
async function getAllEnterprises(filters?: {
  page?: number
  limit?: number
  search?: string
}) {
  const params = new URLSearchParams()
  if (filters?.page) params.append('page', filters.page.toString())
  if (filters?.limit) params.append('limit', filters.limit.toString())
  if (filters?.search) params.append('search', filters.search)

  const response = await fetch(`/api/enterprises?${params.toString()}`, {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to retrieve enterprises')
  }

  const result = await response.json()
  return result.data
}

// Usage
const data = await getAllEnterprises({
  page: 1,
  limit: 10,
  search: 'Acme',
})
```

### 3. Get Enterprise by ID

Retrieve a specific enterprise by its ID.

**Endpoint:** `GET /api/enterprises/{id}`

**Authentication:** Required (Admin only)

**Path Parameters:**
- `id` (string, required): Enterprise ID

**Response (200 OK):**
```json
{
  "message": "Enterprise retrieved successfully",
  "success": true,
  "data": {
    "id": "clx123...",
    "name": "Acme Corporation",
    "code": "ACME01",
    "sessionsPerMonth": 50,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**

- **404 Not Found**: Enterprise not found
  ```json
  {
    "message": "Enterprise not found",
    "success": false
  }
  ```

**Example Usage:**
```typescript
async function getEnterpriseById(id: string) {
  const response = await fetch(`/api/enterprises/${id}`, {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to retrieve enterprise')
  }

  const result = await response.json()
  return result.data
}
```

### 4. Update Enterprise

Update an existing enterprise.

**Endpoint:** `PUT /api/enterprises/{id}`

**Authentication:** Required (Admin only)

**Path Parameters:**
- `id` (string, required): Enterprise ID

**Request Body:**
```json
{
  "name": "Acme Corporation Updated",
  "code": "ACME02",
  "sessionsPerMonth": 100
}
```

**Request Schema:**
- `name` (string, optional): Enterprise name (1-200 characters)
- `code` (string, optional): Enterprise code (1-50 characters)
- `sessionsPerMonth` (number, optional): Number of sessions allowed per month (minimum: 0)

**Response (200 OK):**
```json
{
  "message": "Enterprise updated successfully",
  "success": true,
  "data": {
    "id": "clx123...",
    "name": "Acme Corporation Updated",
    "code": "ACME02",
    "sessionsPerMonth": 100,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

**Error Responses:**

- **400 Bad Request**: Enterprise name or code already exists
- **404 Not Found**: Enterprise not found

**Example Usage:**
```typescript
async function updateEnterprise(
  id: string,
  data: {
    name?: string
    code?: string
    sessionsPerMonth?: number
  }
) {
  const response = await fetch(`/api/enterprises/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to update enterprise')
  }

  const result = await response.json()
  return result.data
}
```

### 5. Delete Enterprise

Delete an enterprise by ID.

**Endpoint:** `DELETE /api/enterprises/{id}`

**Authentication:** Required (Admin only)

**Path Parameters:**
- `id` (string, required): Enterprise ID

**Response (200 OK):**
```json
{
  "message": "Enterprise deleted successfully",
  "success": true
}
```

**Error Responses:**

- **404 Not Found**: Enterprise not found

**Example Usage:**
```typescript
async function deleteEnterprise(id: string) {
  const response = await fetch(`/api/enterprises/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to delete enterprise')
  }

  const result = await response.json()
  return result
}
```

## Enterprise Code Generation

The system can automatically generate enterprise codes from the enterprise name:

### Format
- **Pattern**: First 3 letters (uppercase) + 3 random numbers
- **Total Length**: 6 characters
- **Example**: "Acme Corporation" → "ACM123"

### Algorithm
1. Removes special characters and spaces from the name
2. Converts to uppercase
3. Takes the first 3 letters
4. If less than 3 letters, pads with 'X'
5. Appends 3 random numbers (100-999)
6. Checks for uniqueness in the database
7. If code exists, generates new numbers until unique

### Manual vs Auto-Generated

**Manual Code:**
```json
{
  "name": "Acme Corporation",
  "code": "ACME01",
  "sessionsPerMonth": 50,
  "generateCode": false
}
```

**Auto-Generated Code:**
```json
{
  "name": "Acme Corporation",
  "sessionsPerMonth": 50,
  "generateCode": true
}
```

When `generateCode: true` or `code` is not provided, the system automatically generates a unique code.

## Integration Notes

1. **Admin-Only Access**: All endpoints require admin authentication. Ensure your frontend checks user role before displaying enterprise management UI.

2. **Name and Code Uniqueness**: Both enterprise names and codes are validated for uniqueness (case-insensitive for names). If a name or code already exists, the API returns a 400 Bad Request error.

3. **Pagination**: The list endpoint supports pagination. Default is 10 items per page.

4. **Search**: The list endpoint supports case-insensitive search by name or code.

5. **Sessions Per Month**: This field tracks how many sessions each enterprise is allowed per month. This can be used for quota management.

## Error Handling Best Practices

```typescript
async function handleEnterpriseOperation(
  operation: () => Promise<any>
) {
  try {
    return await operation()
  } catch (error) {
    if (error instanceof Error) {
      // Handle specific error cases
      if (error.message.includes('Unauthorized')) {
        // Redirect to login
        window.location.href = '/login'
        return
      }

      if (error.message.includes('Forbidden')) {
        // Show access denied message
        alert('You do not have permission to perform this action')
        return
      }

      if (error.message.includes('already exists')) {
        // Show code conflict message
        alert('This enterprise code is already in use. Please choose a different code.')
        return
      }

      if (error.message.includes('not found')) {
        // Show not found message
        alert('Enterprise not found')
        return
      }
    }

    // Generic error handling
    alert('An error occurred. Please try again.')
  }
}
```

## React Component Example

```tsx
import { useState } from 'react'

function EnterpriseForm({ enterprise, onSuccess }: {
  enterprise?: Enterprise
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    name: enterprise?.name || '',
    code: enterprise?.code || '',
    sessionsPerMonth: enterprise?.sessionsPerMonth || 0,
    generateCode: !enterprise, // Auto-generate for new enterprises
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const url = enterprise
        ? `/api/enterprises/${enterprise.id}`
        : '/api/enterprises'
      const method = enterprise ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Operation failed')
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Enterprise Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />

      {!formData.generateCode && (
        <input
          type="text"
          placeholder="Enterprise Code"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          required
        />
      )}

      <label>
        <input
          type="checkbox"
          checked={formData.generateCode}
          onChange={(e) => setFormData({ ...formData, generateCode: e.target.checked })}
        />
        Auto-generate code from name
      </label>

      <input
        type="number"
        placeholder="Sessions Per Month"
        value={formData.sessionsPerMonth}
        onChange={(e) => setFormData({ ...formData, sessionsPerMonth: parseInt(e.target.value) })}
        min="0"
        required
      />

      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Saving...' : enterprise ? 'Update' : 'Create'}
      </button>
    </form>
  )
}
```

## Related Endpoints

- **Patient Signup**: Patients use enterprise codes during signup (`/api/auth/patient/signup`)
- **User Management**: Admin endpoints for managing users associated with enterprises

## Security Considerations

1. **Admin-Only Access**: All endpoints are protected and require admin role
2. **Code Validation**: Enterprise codes are validated for uniqueness server-side
3. **Input Validation**: All inputs are validated using Zod schemas
4. **Session Management**: Authentication is handled via better-auth session cookies


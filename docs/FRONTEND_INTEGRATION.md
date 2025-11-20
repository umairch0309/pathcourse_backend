# Frontend Integration Guide - Service Pricing API

This document provides comprehensive integration instructions for the Service Pricing API endpoints.

## Base URL

All endpoints are prefixed with `/api`:

```
Base URL: https://your-api-domain.com/api
```

## Authentication

Most endpoints require authentication. Include the session cookie or authorization token in your requests.

**Note:** Admin-only endpoints require a user with `role: 'admin'`.

## Service Pricing Endpoints

### 1. Get All Service Pricing (Public)

Retrieve all active service pricing options.

**Endpoint:** `GET /api/service-pricing`

**Authentication:** Not required (public endpoint)

**Response:**
```json
{
  "message": "Service pricing retrieved successfully",
  "success": true,
  "data": {
    "pricing": [
      {
        "id": "clx123...",
        "duration": 15,
        "userPrice": 25.00,
        "doctorAmount": 12.00,
        "platformAmount": 13.00,
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      },
      {
        "id": "clx456...",
        "duration": 30,
        "userPrice": 55.00,
        "doctorAmount": 25.00,
        "platformAmount": 30.00,
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      },
      {
        "id": "clx789...",
        "duration": 45,
        "userPrice": 70.00,
        "doctorAmount": 32.00,
        "platformAmount": 38.00,
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      },
      {
        "id": "clx012...",
        "duration": 60,
        "userPrice": 95.00,
        "doctorAmount": 45.00,
        "platformAmount": 50.00,
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

**Example Usage (JavaScript/TypeScript):**
```typescript
async function getAllServicePricing() {
  const response = await fetch('/api/service-pricing', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  const data = await response.json()
  return data.data.pricing
}
```

---

### 2. Get Service Pricing by Duration (Public)

Retrieve pricing for a specific duration.

**Endpoint:** `GET /api/service-pricing/duration/{duration}`

**Authentication:** Not required (public endpoint)

**Path Parameters:**
- `duration` (string): Duration in minutes (e.g., "15", "30", "45", "60")

**Response:**
```json
{
  "message": "Service pricing retrieved successfully",
  "success": true,
  "data": {
    "id": "clx123...",
    "duration": 15,
    "userPrice": 25.00,
    "doctorAmount": 12.00,
    "platformAmount": 13.00,
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Example Usage:**
```typescript
async function getPricingByDuration(duration: number) {
  const response = await fetch(`/api/service-pricing/duration/${duration}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Pricing not found')
  }

  const data = await response.json()
  return data.data
}
```

---

### 3. Create Service Pricing (Admin Only)

Create a new service pricing option.

**Endpoint:** `POST /api/service-pricing`

**Authentication:** Required (Admin role)

**Request Body:**
```json
{
  "duration": 15,
  "userPrice": 25.00,
  "doctorAmount": 12.00,
  "platformAmount": 13.00
}
```

**Validation Rules:**
- `duration` must be a positive integer
- `userPrice`, `doctorAmount`, and `platformAmount` must be positive numbers
- `doctorAmount + platformAmount` must equal `userPrice` (within 0.01 tolerance)

**Response:**
```json
{
  "message": "Service pricing created successfully",
  "success": true,
  "data": {
    "id": "clx123...",
    "duration": 15,
    "userPrice": 25.00,
    "doctorAmount": 12.00,
    "platformAmount": 13.00,
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Example Usage:**
```typescript
async function createServicePricing(pricing: {
  duration: number
  userPrice: number
  doctorAmount: number
  platformAmount: number
}) {
  const response = await fetch('/api/service-pricing', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Include authentication headers
    },
    credentials: 'include', // Include cookies for session
    body: JSON.stringify(pricing),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to create pricing')
  }

  const data = await response.json()
  return data.data
}
```

---

### 4. Update Service Pricing by ID (Admin Only)

Update an existing service pricing by its ID.

**Endpoint:** `PUT /api/service-pricing/{id}`

**Authentication:** Required (Admin role)

**Path Parameters:**
- `id` (string): Service pricing ID

**Request Body:**
```json
{
  "userPrice": 26.00,
  "doctorAmount": 12.50,
  "platformAmount": 13.50,
  "isActive": true
}
```

**Note:** All fields are optional. If updating prices, the sum validation still applies.

**Response:**
```json
{
  "message": "Service pricing updated successfully",
  "success": true,
  "data": {
    "id": "clx123...",
    "duration": 15,
    "userPrice": 26.00,
    "doctorAmount": 12.50,
    "platformAmount": 13.50,
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

---

### 5. Update Service Pricing by Duration (Admin Only)

Update an existing service pricing by duration.

**Endpoint:** `PUT /api/service-pricing/duration/{duration}`

**Authentication:** Required (Admin role)

**Path Parameters:**
- `duration` (string): Duration in minutes

**Request Body:**
```json
{
  "userPrice": 26.00,
  "doctorAmount": 12.50,
  "platformAmount": 13.50
}
```

**Example Usage:**
```typescript
async function updatePricingByDuration(
  duration: number,
  updates: {
    userPrice?: number
    doctorAmount?: number
    platformAmount?: number
    isActive?: boolean
  }
) {
  const response = await fetch(`/api/service-pricing/duration/${duration}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(updates),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to update pricing')
  }

  const data = await response.json()
  return data.data
}
```

---

### 6. Delete Service Pricing (Admin Only)

Soft delete a service pricing (sets `isActive` to `false`).

**Endpoint:** `DELETE /api/service-pricing/{id}`

**Authentication:** Required (Admin role)

**Path Parameters:**
- `id` (string): Service pricing ID

**Response:**
```json
{
  "message": "Service pricing deleted successfully",
  "success": true
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
  "message": "Service pricing not found",
  "success": false
}
```

### 409 Conflict
```json
{
  "message": "Service pricing for this duration already exists",
  "success": false
}
```

### 422 Unprocessable Entity
```json
{
  "message": "Doctor amount + Platform amount must equal user price",
  "success": false,
  "errors": {
    "userPrice": ["Doctor amount + Platform amount must equal user price"]
  }
}
```

---

## Default Pricing Structure

The system comes pre-seeded with the following pricing:

| Duration | User Pays | Doctor Receives | Platform Keeps |
|----------|-----------|-----------------|----------------|
| 15 min   | $25.00    | $12.00          | $13.00         |
| 30 min   | $55.00    | $25.00          | $30.00         |
| 45 min   | $70.00    | $32.00          | $38.00         |
| 60 min   | $95.00    | $45.00          | $50.00         |

---

## React/Next.js Integration Example

```typescript
// hooks/useServicePricing.ts
import { useState, useEffect } from 'react'

interface ServicePricing {
  id: string
  duration: number
  userPrice: number
  doctorAmount: number
  platformAmount: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export function useServicePricing() {
  const [pricing, setPricing] = useState<ServicePricing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPricing() {
      try {
        const response = await fetch('/api/service-pricing')
        const data = await response.json()

        if (data.success) {
          setPricing(data.data.pricing)
        } else {
          setError(data.message)
        }
      } catch (err) {
        setError('Failed to fetch pricing')
      } finally {
        setLoading(false)
      }
    }

    fetchPricing()
  }, [])

  const getPricingByDuration = (duration: number) => {
    return pricing.find(p => p.duration === duration)
  }

  return { pricing, loading, error, getPricingByDuration }
}
```

**Usage in Component:**
```tsx
import { useServicePricing } from '@/hooks/useServicePricing'

export default function PricingSelector() {
  const { pricing, loading, getPricingByDuration } = useServicePricing()

  if (loading) return <div>Loading pricing...</div>

  return (
    <div>
      {pricing.map(p => (
        <div key={p.id}>
          <h3>{p.duration} minutes</h3>
          <p>Price: ${p.userPrice}</p>
          <button onClick={() => selectDuration(p.duration)}>
            Select
          </button>
        </div>
      ))}
    </div>
  )
}
```

---

## Seeding Initial Data

To seed the initial pricing data, run:

```bash
bun run db:seed
```

Or manually:

```bash
bun prisma/seed.ts
```

This will create the four default pricing options (15, 30, 45, 60 minutes) with the commission structure shown above.

---

## Notes

1. **Price Validation:** When creating or updating pricing, the system validates that `doctorAmount + platformAmount = userPrice` (within 0.01 tolerance for floating-point precision).

2. **Soft Delete:** The delete endpoint performs a soft delete by setting `isActive: false`. The record remains in the database but won't appear in public queries.

3. **Duration Uniqueness:** Each duration can only have one active pricing record. Attempting to create a duplicate will return a 409 Conflict error.

4. **Admin Access:** All write operations (create, update, delete) require admin authentication. Public endpoints (get all, get by duration) are accessible without authentication.

